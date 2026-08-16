/**
 * Gladiator Arena — Turn-Based Arena Combat View
 * Renders live combat animations, agent decision logs, 6-slot anatomy damage,
 * Blood Bowl recoil, crowd favor dynamics, and post-match surgical reports.
 */

import React, { useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { BodyPart } from '../types';
import { AnatomyPaperDoll } from './AnatomyPaperDoll';
import { StickFighter, FighterPose } from './StickFighter';
import { getGladiatorAnatomySummary } from '../../../engine/shared/anatomy';
import { 
  Swords, 
  Shield, 
  Zap, 
  Flame, 
  HeartCrack, 
  
  Play, 
  Pause, 
  FastForward, 
  ChevronRight, 
  Trophy, 
  Skull, 
  Coins, 
  Sparkles, 
  Users, 
  
  ArrowLeft,
  MessageSquare
} from 'lucide-react';

export const ArenaCombatView: React.FC = () => {
  const {
    activeBout,
    stepCombatTurn,
    instantResolveCombat,
    concludeBout,
    combatSpeed,
    setCombatSpeed,
    isCombatAutoPlaying,
    setIsCombatAutoPlaying,
  } = useGame();

  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll combat logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [activeBout?.logs.length]);

  if (!activeBout) return null;

  const playerFighter = activeBout.playerRoster[activeBout.activePlayerIndex];
  const enemyFighter = activeBout.enemyRoster[activeBout.activeEnemyIndex];

  const playerAnatomy = playerFighter ? getGladiatorAnatomySummary(playerFighter) : null;
  const enemyAnatomy = enemyFighter ? getGladiatorAnatomySummary(enemyFighter) : null;

  const latestLog = activeBout.logs[activeBout.logs.length - 1];
  const isVictory = activeBout.winner === 'player';
  const isDefeat = activeBout.winner === 'enemy';

  const playerIsCyber = playerFighter ? (Object.values(playerFighter.parts) as BodyPart[]).some(p => p.cyberOrganicLean > 0.3) : false;
  const enemyIsCyber = enemyFighter ? (Object.values(enemyFighter.parts) as BodyPart[]).some(p => p.cyberOrganicLean > 0.3) : false;

  // Spatial Combat Animation Sequencer (Windup -> Travel -> Contact -> Recovery -> Idle)
  type AnimPhase = 'windup' | 'travel' | 'contact' | 'recovery' | 'idle';
  const [animPhase, setAnimPhase] = React.useState<AnimPhase>('idle');
  const [playerXOffset, setPlayerXOffset] = React.useState<number>(0);
  const [enemyXOffset, setEnemyXOffset] = React.useState<number>(0);
  const [contactSpark, setContactSpark] = React.useState<boolean>(false);
  const [showCallout, setShowCallout] = React.useState<boolean>(false);

  useEffect(() => {
    if (!latestLog || latestLog.actorId === 'system') {
      setAnimPhase('idle');
      setPlayerXOffset(0);
      setEnemyXOffset(0);
      setContactSpark(false);
      setShowCallout(true);
      return;
    }

    const isPlayerActor = latestLog.actorIsPlayer;
    const isAttack = ['quick_attack', 'power_attack', 'charge'].includes(latestLog.action);
    const isQuick = latestLog.action === 'quick_attack';
    const isPower = latestLog.action === 'power_attack' || latestLog.action === 'charge';
    const isHit = latestLog.hit && latestLog.damageDealt > 0;

    // Distinct spatial travel distances: Quick attack is a short crisp step; Power attack is a deep committed lunge
    const travelDist = isQuick ? 85 : isPower ? 160 : 0;
    const flinchDist = 18;

    // Total sequence duration dynamically scaled by combat speed setting
    const baseT = combatSpeed === 4 ? 180 : combatSpeed === 2 ? 440 : 820;
    const tWindup = baseT * 0.18;
    const tContact = baseT * 0.52;
    const tRecovery = baseT * 0.78;

    // Phase 1: Windup
    setAnimPhase('windup');
    setContactSpark(false);
    setShowCallout(false);

    if (isAttack && isPower) {
      if (isPlayerActor) setPlayerXOffset(-14);
      else setEnemyXOffset(14);
    } else {
      setPlayerXOffset(0);
      setEnemyXOffset(0);
    }

    // Phase 2: Travel toward contact point
    const timerTravel = setTimeout(() => {
      setAnimPhase('travel');
      if (isAttack) {
        if (isPlayerActor) setPlayerXOffset(travelDist);
        else setEnemyXOffset(-travelDist);
      }
    }, tWindup);

    // Phase 3: Contact Frame reached (Defender reactions and impact sparks trigger strictly here)
    const timerContact = setTimeout(() => {
      setAnimPhase('contact');
      setShowCallout(true);
      if (isAttack) {
        if (isHit) {
          setContactSpark(true);
          // Defender flinches on hit
          if (isPlayerActor) setEnemyXOffset(flinchDist);
          else setPlayerXOffset(-flinchDist);
        }
      } else {
        setShowCallout(true);
      }
    }, tContact);

    // Phase 4: Recovery & Return to base
    const timerRecovery = setTimeout(() => {
      setAnimPhase('recovery');
      setContactSpark(false);
      setPlayerXOffset(0);
      setEnemyXOffset(0);
    }, tRecovery);

    // Phase 5: Settle to idle
    const timerIdle = setTimeout(() => {
      setAnimPhase('idle');
    }, baseT);

    return () => {
      clearTimeout(timerTravel);
      clearTimeout(timerContact);
      clearTimeout(timerRecovery);
      clearTimeout(timerIdle);
    };
  }, [latestLog?.id, combatSpeed]);

  // Determine current active pose for player & enemy derived from sequencer and real combat outcomes
  const getFighterPose = (isPlayerSide: boolean): FighterPose => {
    const gladiator = isPlayerSide ? playerFighter : enemyFighter;
    const anatomy = isPlayerSide ? playerAnatomy : enemyAnatomy;

    if (!gladiator || !anatomy || anatomy.isKnockedOut || anatomy.totalCurrentHp <= 0) {
      return 'down';
    }

    if (!latestLog || latestLog.actorId === 'system') {
      return 'idle';
    }

    const isActor = latestLog.actorIsPlayer === isPlayerSide;

    if (isActor) {
      if (latestLog.malfunctionTriggered) {
        return 'staggered';
      }
      switch (latestLog.action) {
        case 'quick_attack':
          return animPhase === 'idle' ? 'idle' : 'quick_attack';
        case 'power_attack':
        case 'charge':
          return animPhase === 'idle' ? 'idle' : 'power_attack';
        case 'defend':
          return 'defend';
        case 'taunt':
        case 'tag_out':
          return animPhase === 'idle' ? 'idle' : 'taunt';
        default:
          return 'idle';
      }
    } else {
      // Defender Side
      const isAttack = ['quick_attack', 'power_attack', 'charge'].includes(latestLog.action);
      
      // Before contact frame (windup & travel), defender is not reacting yet!
      if (animPhase === 'windup' || animPhase === 'travel') {
        const defending = isPlayerSide ? activeBout.playerDefenseActive : activeBout.enemyDefenseActive;
        return defending ? 'defend' : 'idle';
      }

      // At or after contact frame:
      if (isAttack) {
        if (latestLog.hit && latestLog.damageDealt > 0) {
          return anatomy.isKnockedOut || anatomy.totalCurrentHp <= 0 ? 'down' : 'staggered';
        }
        // If miss, defender remains unaffected (idle / defend)!
        const defending = isPlayerSide ? activeBout.playerDefenseActive : activeBout.enemyDefenseActive;
        return defending ? 'defend' : 'idle';
      }

      const stunned = isPlayerSide ? activeBout.playerStunned : activeBout.enemyStunned;
      if (stunned) {
        return 'staggered';
      }

      const defending = isPlayerSide ? activeBout.playerDefenseActive : activeBout.enemyDefenseActive;
      if (defending) {
        return 'defend';
      }

      return 'idle';
    }
  };

  const playerPose = getFighterPose(true);
  const enemyPose = getFighterPose(false);

  // Crowd Favor Percentage (-100 to +100 -> 0% to 100%)
  const crowdFavorPercent = Math.min(100, Math.max(0, ((activeBout.crowdFavor + 100) / 200) * 100));
  const crowdBonusMultiplier = 1 + Math.max(0, activeBout.crowdFavor) / 250;
  const potentialPurse = Math.round(activeBout.opponent.purseReward * crowdBonusMultiplier);

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-md flex flex-col overflow-y-auto">
      {/* Combat Top Header */}
      <div className="bg-stone-900 border-b border-stone-800 px-4 py-2.5 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* Arena Name & Round Indicator */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-lg bg-red-950/80 border border-red-600/40 text-red-400 font-bold text-xs uppercase flex items-center gap-1.5">
              <Swords className="w-4 h-4 text-red-400 animate-pulse" />
              <span>ROUND {activeBout.round}</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-100 uppercase tracking-wide">
                {activeBout.opponent.name}
              </h2>
              <span className="text-[11px] text-stone-400 font-mono">
                {activeBout.isTeamBout ? 'Tag-Team Arena Clash' : 'Solo Gladiator Duel'}
              </span>
            </div>
          </div>

          {/* Crowd Favor Meter */}
          <div className="flex-1 max-w-sm flex flex-col gap-1 px-3">
            <div className="flex justify-between text-[10px] font-mono font-bold">
              <span className="text-red-400">Hostile Crowd</span>
              <span className="text-amber-300">
                Audience Favor: {activeBout.crowdFavor > 0 ? `+${activeBout.crowdFavor}` : activeBout.crowdFavor}
              </span>
              <span className="text-emerald-400">Adoring Crowd</span>
            </div>
            <div className="w-full bg-stone-900 rounded-full h-2.5 overflow-hidden border border-stone-700 relative">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${crowdFavorPercent}%` }}
              />
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-stone-400 -translate-x-1/2" />
            </div>
          </div>

          {/* Playback Controls */}
          {!activeBout.isFinished && (
            <div className="flex items-center gap-2">
              {/* Speed Buttons */}
              <div className="flex items-center bg-stone-950 p-0.5 rounded-lg border border-stone-800 text-xs font-mono">
                {([1, 2, 4] as const).map(spd => (
                  <button
                    key={spd}
                    onClick={() => setCombatSpeed(spd)}
                    className={`px-2 py-1 rounded ${
                      combatSpeed === spd ? 'bg-amber-600 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              {/* Play / Pause Auto */}
              <button
                onClick={() => setIsCombatAutoPlaying(!isCombatAutoPlaying)}
                className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1 transition ${
                  isCombatAutoPlaying
                    ? 'bg-amber-600 border-amber-500 text-stone-950 shadow'
                    : 'bg-stone-800 border-stone-700 text-stone-300'
                }`}
                title={isCombatAutoPlaying ? 'Pause Simulation' : 'Auto-Play Simulation'}
              >
                {isCombatAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              {/* Step Once */}
              <button
                onClick={stepCombatTurn}
                disabled={isCombatAutoPlaying}
                className="p-2 rounded-lg bg-stone-800 border border-stone-700 text-stone-300 hover:text-white disabled:opacity-40 transition"
                title="Step Single Combat Turn"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Fast Forward / Instant */}
              <button
                onClick={instantResolveCombat}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-600/40 text-red-300 hover:bg-red-900/60 text-xs font-bold transition"
                title="Fast Forward to Bout Conclusion"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Instant</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Arena Battlefield Canvas */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 w-full flex flex-col gap-5">
        {/* Arena Ring Floor Visualizer with StickFighter Combat Stage */}
        <div className="relative bg-gradient-to-b from-stone-900/90 to-stone-950 rounded-3xl border border-stone-800 p-5 md:p-6 shadow-2xl overflow-hidden min-h-[360px] flex flex-col justify-between gap-6">
          {/* Subtle Arena Sand Grid Lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

          {/* Active Combatants Header Stats */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Player Side (Left) */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-lg font-bold text-stone-100">{playerFighter?.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono">
                    YOUR FRAME
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-stone-300">
                  {playerAnatomy?.totalCurrentHp}/{playerAnatomy?.totalMaxHp} Vital HP
                </span>
              </div>

              {/* Vital Health Bar */}
              <div className="w-full bg-stone-900 rounded-full h-3.5 overflow-hidden border border-stone-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (playerAnatomy?.overallHpRatio || 0) * 100)}%` }}
                />
              </div>
            </div>

            {/* Enemy Side (Right) */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <h3 className="text-lg font-bold text-stone-100">{enemyFighter?.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-red-950 border border-red-500/40 text-red-400 font-mono">
                    OPPONENT
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-stone-300">
                  {enemyAnatomy?.totalCurrentHp}/{enemyAnatomy?.totalMaxHp} Vital HP
                </span>
              </div>

              {/* Vital Health Bar */}
              <div className="w-full bg-stone-900 rounded-full h-3.5 overflow-hidden border border-stone-800">
                <div
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (enemyAnatomy?.overallHpRatio || 0) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Center 2D Stick Figure Duel Stage with Real Spatial Travel & Contact */}
          <div className="relative z-10 my-2 px-6 py-6 bg-stone-950/80 rounded-2xl border border-stone-800/80 flex items-center justify-between overflow-hidden min-h-[220px]">
            {/* Arena Floor Distance Markers & Center Line */}
            <div className="absolute inset-x-0 bottom-6 flex items-center justify-between px-12 pointer-events-none opacity-20">
              <div className="w-16 h-0.5 bg-stone-500 rounded" />
              <div className="w-8 h-0.5 bg-stone-600 rounded" />
              <div className="w-0.5 h-6 bg-amber-500 rounded" /> {/* Center line */}
              <div className="w-8 h-0.5 bg-stone-600 rounded" />
              <div className="w-16 h-0.5 bg-stone-500 rounded" />
            </div>

            {/* Player Stick Fighter (Left side, moving right on attack) */}
            <div 
              className="flex flex-col items-center z-10 transition-transform will-change-transform"
              style={{
                transform: `translateX(${playerXOffset}px)`,
                transitionDuration: animPhase === 'windup' ? '120ms' : animPhase === 'travel' ? '220ms' : animPhase === 'recovery' ? '280ms' : '180ms',
                transitionTimingFunction: animPhase === 'travel' ? 'cubic-bezier(0.2, 0.9, 0.3, 1.2)' : 'ease-in-out',
              }}
            >
              <StickFighter
                pose={playerPose}
                facing="right"
                isPlayer={true}
                isCyber={playerIsCyber}
                name={playerFighter?.name}
                isContactFrame={contactSpark && latestLog?.actorIsPlayer}
              />
            </div>

            {/* Action Clash Center Callout & Collision Sparks */}
            <div className="flex flex-col items-center justify-center text-center max-w-xs px-4 py-2 bg-stone-900/95 rounded-xl border border-stone-700 shadow-xl z-20 relative">
              {/* Collision Impact Flash Spark */}
              {contactSpark && (
                <div className="absolute -top-3 w-10 h-10 rounded-full bg-amber-400/80 blur-md animate-ping pointer-events-none" />
              )}

              {latestLog && latestLog.actorId !== 'system' ? (
                <>
                  <div className="flex items-center gap-1.5 text-xs font-bold font-mono uppercase tracking-wider text-amber-400">
                    <Zap className={`w-3.5 h-3.5 text-amber-400 ${animPhase === 'contact' ? 'animate-bounce' : ''}`} />
                    <span>{latestLog.action.replace('_', ' ')}</span>
                  </div>
                  <div className="text-sm font-extrabold text-stone-100 mt-0.5">
                    {latestLog.actorName}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap justify-center text-xs">
                    {latestLog.damageDealt > 0 ? (
                      <span className={`px-2 py-0.5 rounded bg-red-950 border border-red-500 text-red-300 font-bold font-mono transition-transform ${
                        animPhase === 'contact' ? 'scale-110' : ''
                      }`}>
                        💥 {latestLog.damageDealt} DMG {latestLog.crit ? '(CRIT!)' : ''}
                      </span>
                    ) : latestLog.action === 'defend' ? (
                      <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-500 text-blue-300 font-bold font-mono">
                        🛡️ BRACED
                      </span>
                    ) : latestLog.action === 'taunt' ? (
                      <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-500 text-amber-300 font-bold font-mono">
                        👑 +{latestLog.crowdFavorDelta || 10} FAVOR
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-400 font-mono">
                        MISS / WHISPER
                      </span>
                    )}
                    {latestLog.targetSlot && (
                      <span className="text-[10px] text-stone-400 uppercase font-mono">
                        &rarr; {latestLog.targetSlot}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center py-2 text-stone-400 text-xs font-mono">
                  <Swords className="w-5 h-5 text-amber-500/80 mb-1 animate-pulse" />
                  <span>ARENA FLOOR READY</span>
                </div>
              )}
            </div>

            {/* Enemy Stick Fighter (Right side, moving left on attack) */}
            <div 
              className="flex flex-col items-center z-10 transition-transform will-change-transform"
              style={{
                transform: `translateX(${enemyXOffset}px)`,
                transitionDuration: animPhase === 'windup' ? '120ms' : animPhase === 'travel' ? '220ms' : animPhase === 'recovery' ? '280ms' : '180ms',
                transitionTimingFunction: animPhase === 'travel' ? 'cubic-bezier(0.2, 0.9, 0.3, 1.2)' : 'ease-in-out',
              }}
            >
              <StickFighter
                pose={enemyPose}
                facing="left"
                isPlayer={false}
                isCyber={enemyIsCyber}
                name={enemyFighter?.name}
                isContactFrame={contactSpark && !latestLog?.actorIsPlayer}
              />
            </div>
          </div>

          {/* Status Tags & Standby Benches Footer */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Player Side Tags & Bench */}
            <div className="flex flex-col gap-2">
              {/* Status Tags */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {activeBout.playerDefenseActive && (
                  <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-500 text-blue-300 font-semibold flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Defensive Guard Active
                  </span>
                )}
                {activeBout.playerVulnerable && (
                  <span className="px-2 py-0.5 rounded bg-red-950 border border-red-500 text-red-400 font-bold flex items-center gap-1 animate-bounce">
                    💥 Vulnerable (Recoil)
                  </span>
                )}
                {activeBout.playerStunned && (
                  <span className="px-2 py-0.5 rounded bg-yellow-950 border border-yellow-500 text-yellow-300 font-bold animate-pulse">
                    💫 Stunned
                  </span>
                )}
                {activeBout.playerAdrenalineNextCrit && (
                  <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-500 text-amber-300 font-bold flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-400" /> Adrenaline Surge (+Crit)
                  </span>
                )}
              </div>

              {/* Tag-Team Standby Bench */}
              {activeBout.playerRoster.length > 1 && (
                <div className="bg-stone-950/80 p-2.5 rounded-xl border border-stone-800">
                  <span className="text-[10px] font-bold uppercase text-stone-400 block mb-1.5 flex items-center gap-1">
                    <Users className="w-3 h-3 text-amber-400" /> Standby Teammates
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeBout.playerRoster.map((g, idx) => {
                      const isActive = idx === activeBout.activePlayerIndex;
                      const sum = getGladiatorAnatomySummary(g);
                      return (
                        <div
                          key={g.id}
                          className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-2 ${
                            isActive
                              ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                              : sum.isKnockedOut
                              ? 'bg-stone-900 border-stone-800 text-stone-600 line-through'
                              : 'bg-stone-900 border-stone-800 text-stone-300'
                          }`}
                        >
                          <span>{g.name}</span>
                          <span className="text-[10px] font-mono">({sum.totalCurrentHp} HP)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Enemy Side Tags & Bench */}
            <div className="flex flex-col gap-2">
              {/* Status Tags */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {activeBout.enemyDefenseActive && (
                  <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-500 text-blue-300 font-semibold flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Defensive Guard Active
                  </span>
                )}
                {activeBout.enemyVulnerable && (
                  <span className="px-2 py-0.5 rounded bg-red-950 border border-red-500 text-red-400 font-bold flex items-center gap-1 animate-bounce">
                    💥 Vulnerable (Recoil)
                  </span>
                )}
                {activeBout.enemyStunned && (
                  <span className="px-2 py-0.5 rounded bg-yellow-950 border border-yellow-500 text-yellow-300 font-bold animate-pulse">
                    💫 Stunned
                  </span>
                )}
                {activeBout.enemyAdrenalineNextCrit && (
                  <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-500 text-amber-300 font-bold flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-400" /> Adrenaline Surge (+Crit)
                  </span>
                )}
              </div>

              {/* Enemy Tag-Team Standby Bench */}
              {activeBout.enemyRoster.length > 1 && (
                <div className="bg-stone-950/80 p-2.5 rounded-xl border border-stone-800">
                  <span className="text-[10px] font-bold uppercase text-stone-400 block mb-1.5 flex items-center gap-1">
                    <Users className="w-3 h-3 text-red-400" /> Opponent Bench
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeBout.enemyRoster.map((g, idx) => {
                      const isActive = idx === activeBout.activeEnemyIndex;
                      const sum = getGladiatorAnatomySummary(g);
                      return (
                        <div
                          key={g.id}
                          className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-2 ${
                            isActive
                              ? 'bg-red-950 border-red-500 text-red-300 font-bold'
                              : sum.isKnockedOut
                              ? 'bg-stone-900 border-stone-800 text-stone-600 line-through'
                              : 'bg-stone-900 border-stone-800 text-stone-300'
                          }`}
                        >
                          <span>{g.name}</span>
                          <span className="text-[10px] font-mono">({sum.totalCurrentHp} HP)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Anatomy Matrix Side-by-Side & Live Combat Log (2 columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Player & Enemy Paper Dolls (6 cols) */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {playerFighter && (
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3.5 flex flex-col gap-2">
                <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                  {playerFighter.name} Anatomy
                </span>
                <AnatomyPaperDoll gladiator={playerFighter} compact={true} readOnly={true} />
              </div>
            )}

            {enemyFighter && (
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3.5 flex flex-col gap-2">
                <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                  {enemyFighter.name} Anatomy
                </span>
                <AnatomyPaperDoll gladiator={enemyFighter} compact={true} readOnly={true} />
              </div>
            )}
          </div>

          {/* Live Action Telemetry & Combat Log (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col h-[400px]">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
                <span className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  Combat Telemetry & Agent Decision Log
                </span>
                <span className="text-[10px] font-mono text-stone-400">
                  {activeBout.logs.length} Entries
                </span>
              </div>

              {/* Scrollable Logs */}
              <div ref={logContainerRef} className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 font-mono text-xs">
                {activeBout.logs.map(log => {
                  const isPlayer = log.actorIsPlayer;
                  const isCrit = log.crit;
                  const isMalfunction = log.malfunctionTriggered;
                  const isSevere = log.severity === 'crippled' || log.severity === 'dismembered';

                  return (
                    <div
                      key={log.id}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isCrit
                          ? 'bg-amber-950/50 border-amber-500/80 text-amber-200 shadow'
                          : isMalfunction
                          ? 'bg-red-950/60 border-red-500/80 text-red-300'
                          : isSevere
                          ? 'bg-purple-950/50 border-purple-500/80 text-purple-200'
                          : isPlayer
                          ? 'bg-stone-950/80 border-emerald-900/40 text-stone-300'
                          : 'bg-stone-950/80 border-red-900/40 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] opacity-75 mb-1">
                        <span className="font-bold text-stone-400">R{log.round} • {log.actorName}</span>
                        {log.crowdFavorDelta && log.crowdFavorDelta !== 0 && (
                          <span
                            className={
                              log.crowdFavorDelta > 0
                                ? 'text-emerald-400 font-bold'
                                : 'text-red-400 font-bold'
                            }
                          >
                            Crowd {log.crowdFavorDelta > 0 ? `+${log.crowdFavorDelta}` : log.crowdFavorDelta}
                          </span>
                        )}
                      </div>
                      <p className="leading-relaxed">{log.message}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post-Match Victory / Defeat Modal */}
      {activeBout.isFinished && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-amber-500 rounded-3xl p-6 md:p-8 max-w-xl w-full flex flex-col gap-5 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center flex flex-col items-center gap-2">
              {isVictory ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-lg">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-stone-100 uppercase tracking-wide">
                    VICTORY IN THE ARENA!
                  </h2>
                  <p className="text-xs text-stone-300 max-w-md">
                    Your Frame(s) crushed the opposition. The arena crowd roars in acclaim!
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center text-red-400 shadow-lg">
                    <Skull className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-red-400 uppercase tracking-wide">
                    DEFEAT & COLLAPSE
                  </h2>
                  <p className="text-xs text-stone-300 max-w-md">
                    Your gladiators were overpowered. Limbs sustained severe trauma and must be repaired in the Medbay.
                  </p>
                </>
              )}
            </div>

            {/* Financial Purse Breakdown */}
            {isVictory && (
              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex flex-col gap-2 font-mono text-xs">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Purse Breakdown
                </span>
                <div className="flex justify-between text-stone-300">
                  <span>Base Bout Purse:</span>
                  <span>{activeBout.opponent.purseReward}g</span>
                </div>
                <div className="flex justify-between text-stone-300">
                  <span>Crowd Showman Multiplier ({Math.round(crowdBonusMultiplier * 100)}%):</span>
                  <span className="text-emerald-400">+{potentialPurse - activeBout.opponent.purseReward}g</span>
                </div>
                <div className="flex justify-between font-bold text-stone-100 pt-2 border-t border-stone-800 text-sm">
                  <span>Total Gold Awarded:</span>
                  <span className="text-amber-300 flex items-center gap-1">
                    <Coins className="w-4 h-4 text-amber-400" />
                    +{potentialPurse} Gold
                  </span>
                </div>

                {activeBout.opponent.specialLootPart && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-950/60 border border-amber-600/40 text-amber-300 text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Special Loot Salvaged: <strong>{activeBout.opponent.specialLootPart.name}</strong> added to spare inventory!</span>
                  </div>
                )}
              </div>
            )}

            {/* Surgeon Trauma Report */}
            <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex flex-col gap-2 text-xs">
              <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider flex items-center gap-1">
                <HeartCrack className="w-3.5 h-3.5" /> Post-Match Trauma & Scarring Report
              </span>
              <div className="flex flex-col gap-1.5 text-stone-300 max-h-32 overflow-y-auto pr-1">
                {activeBout.playerRoster.map(g => {
                  const partsList = Object.values(g.parts) as BodyPart[];
                  const scarredParts = partsList.filter(p => p.scarHpPenalty > 0);
                  const damagedParts = partsList.filter(p => p.currentHp < p.maxHp);

                  return (
                    <div key={g.id} className="p-2 rounded-lg bg-stone-900 border border-stone-800/80">
                      <div className="font-bold text-stone-200">{g.name}:</div>
                      <div className="text-[11px] text-stone-400 mt-0.5">
                        {scarredParts.length > 0 ? (
                          <span className="text-red-400 font-semibold">
                            ⚠️ Sustained {scarredParts.length} permanent scar(s) on {scarredParts.map(p => p.name).join(', ')}.
                          </span>
                        ) : damagedParts.length > 0 ? (
                          <span>Took non-permanent damage across {damagedParts.length} limb(s).</span>
                        ) : (
                          <span className="text-emerald-400">Flawless match! No structural trauma sustained.</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Return CTA */}
            <button
              id="return-to-hq-btn"
              onClick={concludeBout}
              className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Manager HQ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
