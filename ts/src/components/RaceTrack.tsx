import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { CurrentRace, RaceResult, Bet } from '../engine/types';
import { SVGRacer } from './SVGRacer';

const TICK_RATE_MS = 50;
const LANE_HEIGHT = 29;          // condensed
const BASE_SPEED = 5;             // old 5x is new 1x
const TRACK_PADDING_LEFT = 48;
const TRACK_PADDING_RIGHT = 60;

interface AnimParticipant {
  horse_id: string;
  gate: number;
  anim_progress: number;   // 0–100, display only — never used for rank
  anim_energy: number;     // display only
  anim_speed: number;      // display only
  anim_finished: boolean;  // display only
  anim_tick: number;       // SVGRacer runTick, display only
}

interface Props {
  race: CurrentRace;
  bets: Bet[];
  onRaceFinish: (results: RaceResult[]) => void;
  onClose: () => void;
}

function energyColor(e: number): string {
  if (e > 60) return '#34d399';
  if (e > 30) return '#fbbf24';
  return '#f87171';
}

export default function RaceTrack({ race, bets, onRaceFinish, onClose }: Props) {
  const distance = race.distance;

  const [isRunning, setIsRunning] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 2 | 3>(1);
  const [resultsDeclared, setResultsDeclared] = useState(false);
  const [announcement, setAnnouncement] = useState('Horses are heading to the starting gates…');

  // Animation state — display only, never used to determine winner
  const [animParticipants, setAnimParticipants] = useState<AnimParticipant[]>(
    race.participants.map(p => ({
      horse_id: p.horse.id,
      gate: p.gate,
      anim_progress: 0,
      anim_energy: 100,
      anim_speed: 0,
      anim_finished: false,
      anim_tick: 0,
    }))
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const declaredRef = useRef(false);

  const declareResults = useCallback(() => {
    if (declaredRef.current) return;
    declaredRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setResultsDeclared(true);
    // Winner is always from Lua final_rank — never from animation order
    const winner = race.participants.find(p => p.final_rank === 1);
    setAnnouncement(`Race complete! ${winner?.horse.name ?? 'Unknown'} wins!`);
  }, [race.participants]);

  // Physics tick — animation display only
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setAnimParticipants(prev => {
        const timeStep = (TICK_RATE_MS / 1000) * speedMultiplier * BASE_SPEED;
        const updated = prev.map(ap => {
          if (ap.anim_finished) return ap;
          const p = race.participants.find(rp => rp.horse.id === ap.horse_id)!;
          const h = p.horse;

          const energyBurnRate = (0.12 - (h.stamina / 100) * 0.08) * (distance / 800) * 0.45;
          const newEnergy = Math.max(0, ap.anim_energy - energyBurnRate * speedMultiplier * BASE_SPEED);

          const baseMaxSpeed = 12.5 + (h.speed / 100) * 8.5;
          const energyRatio = 0.45 + (newEnergy / 100) * 0.55;
          const maxCapableSpeed = baseMaxSpeed * energyRatio;
          const accFactor = 0.08 + (h.acceleration / 100) * 0.12;
          const newSpeed = ap.anim_speed + (maxCapableSpeed - ap.anim_speed) * accFactor * speedMultiplier * BASE_SPEED;

          const tempVariance = (100 - h.temperament) / 120;
          const velocityFinal = newSpeed * (1 + (Math.random() - 0.5) * tempVariance);
          const newDist = (ap.anim_progress / 100) * distance + velocityFinal * timeStep;
          const newProgress = Math.min(100, Math.max(ap.anim_progress, (newDist / distance) * 100));
          const finished = newProgress >= 100;

          return {
            ...ap,
            anim_progress: newProgress,
            anim_energy: newEnergy,
            anim_speed: newSpeed,
            anim_finished: finished,
            anim_tick: ap.anim_tick + BASE_SPEED,
          };
        });

        const allDone = updated.every(ap => ap.anim_finished);
        if (allDone) {
          setTimeout(declareResults, 200);
        }
        return updated;
      });
    }, TICK_RATE_MS);

    intervalRef.current = interval;
    return () => clearInterval(interval);
  }, [isRunning, speedMultiplier, distance, race.participants, declareResults]);

  // Announcer updates
  useEffect(() => {
    if (!isRunning || resultsDeclared) return;
    const leader = [...animParticipants].sort((a, b) => b.anim_progress - a.anim_progress)[0];
    if (!leader) return;
    const p = race.participants.find(rp => rp.horse.id === leader.horse_id);
    const name = p?.horse.name ?? 'The leader';
    const prog = leader.anim_progress;
    if (prog < 5) setAnnouncement("And they're off!");
    else if (prog < 40) setAnnouncement(`${name} is setting the pace!`);
    else if (prog < 75) setAnnouncement(`${name} leads — approaching the home stretch!`);
    else if (prog < 95) setAnnouncement(`${name} is making a run for the line!`);
    else setAnnouncement(`${name} is crossing the line!`);
  }, [animParticipants, isRunning, resultsDeclared, race.participants]);

  const handleStart = useCallback(() => {
    setIsRunning(true);
    setAnnouncement("And they're off!");
  }, []);

  const handleSkip = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setAnimParticipants(prev => prev.map(ap => ({ ...ap, anim_progress: 100, anim_finished: true })));
    declareResults();
  }, [declareResults]);

  const handleContinue = useCallback(() => {
    // Build RaceResult from Lua final_rank — authoritative
    const raceResults: RaceResult[] = race.participants.map(p => ({
      rank: p.final_rank ?? 99,
      horse_id: p.horse.id,
      horse_name: p.horse.name,
      player_owned: p.horse.player_owned,
      payout: 0, // settlement already done in BettingTab before track opened
    }));
    onRaceFinish(raceResults);
    onClose();
  }, [race.participants, onRaceFinish, onClose]);

  // Build results sorted by Lua final_rank for results panel
  const luaResults = [...race.participants]
    .filter(p => p.final_rank !== undefined)
    .sort((a, b) => (a.final_rank ?? 99) - (b.final_rank ?? 99));

  // Bet lookup
  const betByHorse: Record<string, Bet> = {};
  bets.forEach(b => { betByHorse[b.horse_id] = b; });

  const trackWidth = 600;

  return (
    <div className="race-track-fullscreen">
      {/* Header */}
      <div className="race-track-header">
        <div>
          <span className="race-title">{race.name}</span>
          <span className="race-sub" style={{ marginLeft: '0.75rem' }}>{race.distance}m · {race.race_class}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {!isRunning && !resultsDeclared && (
            <button className="btn-primary" onClick={handleStart}>Start Race ▶</button>
          )}
          {isRunning && (
            <>
              {([1, 2, 3] as const).map(s => (
                <button
                  key={s}
                  className={`btn-speed${speedMultiplier === s ? ' active' : ''}`}
                  onClick={() => setSpeedMultiplier(s as 1 | 2 | 3)}
                >{s}x</button>
              ))}
              <button className="btn-neutral" onClick={handleSkip}>Skip ⏭</button>
            </>
          )}
          {!isRunning && !resultsDeclared && (
            <button className="btn-neutral" onClick={handleSkip}>Skip ⏭</button>
          )}
        </div>
      </div>

      {/* Track */}
      <div className="race-track-wrap" style={{ overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${trackWidth} ${race.participants.length * LANE_HEIGHT + 20}`}
          style={{ width: '100%', minWidth: '480px', display: 'block' }}
        >
          {/* Grid lines at 25/50/75% */}
          {[0.25, 0.5, 0.75].map(frac => {
            const x = TRACK_PADDING_LEFT + frac * (trackWidth - TRACK_PADDING_LEFT - TRACK_PADDING_RIGHT);
            return (
              <line key={frac} x1={x} y1={0} x2={x} y2={race.participants.length * LANE_HEIGHT + 20}
                stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="4 4" />
            );
          })}

          {/* Finish line */}
          <line
            x1={trackWidth - TRACK_PADDING_RIGHT} y1={0}
            x2={trackWidth - TRACK_PADDING_RIGHT} y2={race.participants.length * LANE_HEIGHT + 20}
            stroke="rgba(255,255,255,0.35)" strokeWidth={2} strokeDasharray="6 3"
          />
          <text x={trackWidth - TRACK_PADDING_RIGHT + 4} y={14} fill="rgba(255,255,255,0.4)" fontSize={9}>FINISH</text>

          {race.participants.map((p, laneIdx) => {
            const ap = animParticipants.find(a => a.horse_id === p.horse.id)!;
            const laneY = laneIdx * LANE_HEIGHT + 10;
            const trackW = trackWidth - TRACK_PADDING_LEFT - TRACK_PADDING_RIGHT;
            const spriteX = TRACK_PADDING_LEFT + (ap?.anim_progress ?? 0) / 100 * trackW;
            const energyPct = ap?.anim_energy ?? 100;

            return (
              <g key={p.horse.id}>
                {/* Lane background */}
                <rect x={0} y={laneY} width={trackWidth} height={LANE_HEIGHT - 4} rx={3}
                  fill={laneIdx % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.1)'} />

                {/* Gate number */}
                <text x={18} y={laneY + LANE_HEIGHT / 2 + 3} textAnchor="middle"
                  fontSize={8} fill="rgba(255,255,255,0.4)" fontFamily="monospace">
                  {p.gate}
                </text>

                {/* Energy bar */}
                <rect x={spriteX - 13} y={laneY + 1} width={26} height={2} rx={1}
                  fill="rgba(0,0,0,0.4)" />
                <rect x={spriteX - 13} y={laneY + 1} width={26 * energyPct / 100} height={2} rx={1}
                  fill={energyColor(energyPct)} />

                {/* SVGRacer sprite */}
                <foreignObject
                  x={spriteX - 13}
                  y={laneY + 2}
                  width={26}
                  height={26}
                >
                  <SVGRacer
                    colorBody={p.horse.color_body}
                    colorMane={p.horse.color_mane}
                    colorSocks={p.horse.color_socks}
                    colorJockeySilk={p.horse.color_silk}
                    gateNumber={p.gate}
                    isRunning={isRunning && !(ap?.anim_finished)}
                    runTick={ap?.anim_tick ?? 0}
                    size={26}
                  />
                </foreignObject>

                {/* Rank badge — only after results declared, uses Lua final_rank */}
                {resultsDeclared && p.final_rank && (
                  <g>
                    <rect x={trackWidth - TRACK_PADDING_RIGHT + 6} y={laneY + LANE_HEIGHT / 2 - 7}
                      width={28} height={14} rx={3} fill={p.final_rank <= 3 ? '#6c8ef7' : 'rgba(255,255,255,0.1)'} />
                    <text x={trackWidth - TRACK_PADDING_RIGHT + 20} y={laneY + LANE_HEIGHT / 2 + 4}
                      textAnchor="middle" fontSize={9} fontWeight="bold" fill="#fff">
                      #{p.final_rank}
                    </text>
                  </g>
                )}

                {/* Player badge */}
                {p.horse.player_owned && (
                  <text x={TRACK_PADDING_LEFT - 4} y={laneY + LANE_HEIGHT / 2 + 4}
                    textAnchor="end" fontSize={9} fill="#6c8ef7">YOU</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Announcer */}
      <div className="race-announcer">
        <span>📢</span>
        <span>{announcement}</span>
      </div>

      {/* Results panel */}
      {resultsDeclared && (
        <div className="race-results-panel">
          <h3 style={{ marginBottom: '0.75rem' }}>Results</h3>
          <table className="result-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Horse</th>
                <th>Time</th>
                <th>Bet</th>
              </tr>
            </thead>
            <tbody>
              {luaResults.map(p => {
                const bet = betByHorse[p.horse.id];
                return (
                  <tr key={p.horse.id}>
                    <td className={`rank-${p.final_rank}`}>#{p.final_rank}</td>
                    <td>
                      {p.horse.name}
                      {p.horse.player_owned && <span className="badge-player">You</span>}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {p.finish_time ? `${p.finish_time.toFixed(2)}s` : '—'}
                    </td>
                    <td>
                      {bet ? (
                        <span style={{ fontSize: '0.8rem' }}>
                          ${bet.amount} {bet.type}
                          {p.final_rank !== undefined && (
                            (bet.type === 'Win' && p.final_rank === 1) ||
                            (bet.type === 'Place' && p.final_rank <= 3)
                          ) ? (
                            <span className="payout-pos"> ✓ Won</span>
                          ) : (
                            <span className="payout-neg"> ✗ Lost</span>
                          )}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button className="btn-primary" style={{ marginTop: '1rem', width: '100%' }} onClick={handleContinue}>
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}
