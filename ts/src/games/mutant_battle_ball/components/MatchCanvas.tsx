import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useGameLoop } from '../../../hooks';
import { Modal } from '../../../ui/components';
import { PaperDoll } from '../../../engine/paperDoll';
import type { Part, PartsBySlot } from '../../../engine/shared/partSlots';
import type { Mutant } from '../types';
import type { MatchState, MatchAgent } from '../types';
import type { MbbSimulation } from '../simulation/mbbSimulation';
import type { AnimationType } from '../../../engine/paperDoll/chimeraTypes';

const COURT_W = 700;
const COURT_H = 400;
const SCALE_X = COURT_W / 100;
const SCALE_Y = COURT_H / 60;
const EZ_DEPTH = 10;
const AGENT_RENDER_SIZE = 40;

// down_salvage visible-beat duration in frames. At 60fps this is ~0.5s —
// long enough to see the agent go down, short enough to not linger.
// The agent is rendered with 'down_salvage' pose for this many frames
// after the agent_down event before being filtered out of the overlay.
const DOWN_SALVAGE_FRAMES = 30;

// Combat animation display duration in frames. Events are per-tick (one
// frame), but the pose needs to persist long enough to be visible.
// At 60fps this is ~0.33s — a clear visual beat for attack/block/celebration.
const COMBAT_ANIM_FRAMES = 20;

function toScreen(gx: number, gy: number): [number, number] {
  return [gx * SCALE_X, gy * SCALE_Y];
}

// ── Pose derivation ──────────────────────────────────────────────────
//
// Maps real agent status + this-tick events to AnimationType. Events are
// ephemeral (one tick), so combat poses are tracked in a ref with frame
// counters that persist the pose for COMBAT_ANIM_FRAMES after the event.
//
// Priority (highest first):
//   1. down_salvage (agent recently went down — visible beat before removal)
//   2. stagger (agent.status === 'stunned')
//   3. flee_startled (failed-violence blunder event this tick)
//   4. attack (tackle_success event — tackler is the attacker)
//   5. tackle_block (block event — blocker is the defender)
//   6. celebration (scored event — scoring team celebrates)
//   7. sprint (hasBall, no combat)
//   8. walk (no ball, no combat)

interface AgentAnimState {
  // Frame counters for transient combat poses (>0 means active)
  attackFrames: number;
  blockFrames: number;
  celebrationFrames: number;
  fleeStartledFrames: number;
  // down_salvage: counts DOWN from DOWN_SALVAGE_FRAMES to 0
  downSalvageRemaining: number;
}

interface MatchCanvasProps {
  session: unknown;
  sim: MbbSimulation;
  isActive: boolean;
  onMatchEnd: (finalState: MatchState) => void;
  playerRoster: Mutant[];
  opponentMutants: Array<Record<string, unknown>>;
}

export default function MatchCanvas(
  { session, sim, isActive, onMatchEnd, playerRoster, opponentMutants }: MatchCanvasProps
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const matchStateRef = useRef<MatchState | null>(null);

  // Per-agent animation state — persists combat poses across frames
  const animStateRef = useRef<Record<string, AgentAnimState>>({});

  // Build a lookup from agent ID to parts for PaperDoll rendering.
  // Player agents come from the roster (real Parts with Brand/Quality).
  // Opponent agents come from opponentMutants (may have parts or flat stats).
  const agentPartsMap = useMemo(() => {
    const map: Record<string, PartsBySlot | null> = {};
    // Player roster
    for (const m of playerRoster) {
      map[m.id] = m.parts;
    }
    // Opponent mutants — may have parts (post-symmetry-fix) or flat stats
    for (const om of opponentMutants) {
      const id = om['id'] as string || om['name'] as string;
      const parts = om['parts'] as Record<string, string> | undefined;
      if (parts) {
        // Opponent has real parts — build PartsBySlot from session data
        const data = (session as { files: { data: Record<string, unknown> } }).files.data;
        const partsData = data['parts'] as Array<Record<string, unknown>> ?? [];
        const partsMap: Record<string, Part> = {};
        for (const p of partsData) {
          partsMap[p['id'] as string] = p as unknown as Part;
        }
        map[id] = {
          head: parts['head'] ? partsMap[parts['head']] ?? null : null,
          chest: parts['chest'] ? partsMap[parts['chest']] ?? null : null,
          left_arm: parts['left_arm'] ? partsMap[parts['left_arm']] ?? null : null,
          right_arm: parts['right_arm'] ? partsMap[parts['right_arm']] ?? null : null,
          left_leg: parts['left_leg'] ? partsMap[parts['left_leg']] ?? null : null,
          right_leg: parts['right_leg'] ? partsMap[parts['right_leg']] ?? null : null,
        };
      } else {
        map[id] = null; // Flat-stat opponent — no parts for PaperDoll
      }
    }
    return map;
  }, [playerRoster, opponentMutants, session]);

  // Process events to update animation state counters
  const processEventsForAnim = useCallback((ms: MatchState) => {
    const animState = animStateRef.current;
    for (const ev of ms.events) {
      const type = ev['type'] as string;
      // tackle_success → tackler plays 'attack'
      if (type === 'tackle_success') {
        const tacklerId = ev['tackler_id'] as string;
        if (!animState[tacklerId]) animState[tacklerId] = makeAnimState();
        animState[tacklerId].attackFrames = COMBAT_ANIM_FRAMES;
      }
      // block with severity → blocker plays 'tackle_block'
      if (type === 'block' && ev['severity'] && ev['severity'] !== 'none') {
        const blockerId = ev['blocker_id'] as string;
        if (!animState[blockerId]) animState[blockerId] = makeAnimState();
        animState[blockerId].blockFrames = COMBAT_ANIM_FRAMES;
      }
      // tackle_fail with blunder → tackler plays 'flee_startled'
      if (type === 'tackle_fail' && ev['blunder']) {
        const tacklerId = ev['tackler_id'] as string;
        if (!animState[tacklerId]) animState[tacklerId] = makeAnimState();
        animState[tacklerId].fleeStartledFrames = COMBAT_ANIM_FRAMES;
      }
      // failed_violence_turnover → agent plays 'flee_startled'
      if (type === 'failed_violence_turnover') {
        const agentId = ev['agent_id'] as string;
        if (!animState[agentId]) animState[agentId] = makeAnimState();
        animState[agentId].fleeStartledFrames = COMBAT_ANIM_FRAMES;
      }
      // block_fail → blocker blundered, plays 'flee_startled'
      if (type === 'block_fail') {
        const blockerId = ev['blocker_id'] as string;
        if (!animState[blockerId]) animState[blockerId] = makeAnimState();
        animState[blockerId].fleeStartledFrames = COMBAT_ANIM_FRAMES;
      }
      // scored → scoring team plays 'celebration'
      if (type === 'scored') {
        const scoringTeam = ev['team'] as 'player' | 'opponent';
        for (const ag of ms.agents) {
          if (ag.team === scoringTeam && ag.status === 'active') {
            if (!animState[ag.id]) animState[ag.id] = makeAnimState();
            animState[ag.id].celebrationFrames = COMBAT_ANIM_FRAMES;
          }
        }
      }
      // agent_down → agent plays 'down_salvage' for a visible beat
      if (type === 'agent_down') {
        const agentId = ev['agent_id'] as string;
        if (!animState[agentId]) animState[agentId] = makeAnimState();
        animState[agentId].downSalvageRemaining = DOWN_SALVAGE_FRAMES;
      }
    }
  }, []);

  // Decrement all animation frame counters by 1 (called each render frame)
  const decayAnimState = useCallback(() => {
    const animState = animStateRef.current;
    for (const id of Object.keys(animState)) {
      const s = animState[id];
      if (s.attackFrames > 0) s.attackFrames--;
      if (s.blockFrames > 0) s.blockFrames--;
      if (s.celebrationFrames > 0) s.celebrationFrames--;
      if (s.fleeStartledFrames > 0) s.fleeStartledFrames--;
      if (s.downSalvageRemaining > 0) s.downSalvageRemaining--;
    }
  }, []);

  // Derive the animation type for an agent from its status + anim state
  const deriveAnimation = useCallback((agent: MatchAgent): AnimationType => {
    const s = animStateRef.current[agent.id];

    // 1. down_salvage — highest priority, agent is going down
    if (s && s.downSalvageRemaining > 0) return 'down_salvage';

    // 2. stagger — agent is stunned
    if (agent.status === 'stunned') return 'stagger';

    // 3-6. Combat poses from events (persisted via frame counters)
    if (s) {
      if (s.fleeStartledFrames > 0) return 'flee_startled';
      if (s.attackFrames > 0) return 'attack';
      if (s.blockFrames > 0) return 'tackle_block';
      if (s.celebrationFrames > 0) return 'celebration';
    }

    // 7-8. Default poses
    return agent.hasBall ? 'sprint' : 'walk';
  }, []);

  const tick = useCallback((dt: number) => {
    if (!isActive) return;
    const ms = sim.tickMatch(dt);
    matchStateRef.current = ms;
    setMatchState(ms);

    // Process events for animation state before rendering
    processEventsForAnim(ms);

    for (const ev of ms.events) {
      if (ev['type'] === 'agent_down') {
        setShowSubModal(true);
      }
      if (ev['type'] === 'match_ended') {
        onMatchEnd(ms);
      }
    }
  }, [isActive, sim, onMatchEnd, processEventsForAnim]);

  useGameLoop(tick, { paused: !isActive || showSubModal });

  // Canvas draws court, ball, health bars — agents are SVG overlays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !matchState) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Decay animation frame counters each render
    decayAnimState();

    // Court background
    ctx.fillStyle = '#1a1d27';
    ctx.fillRect(0, 0, COURT_W, COURT_H);
    ctx.fillStyle = '#2a3040';
    ctx.fillRect(0, 0, COURT_W, COURT_H);

    // End zones
    ctx.fillStyle = 'rgba(239,68,68,0.15)';
    ctx.fillRect(0, 0, EZ_DEPTH * SCALE_X, COURT_H);
    ctx.fillStyle = 'rgba(59,130,246,0.15)';
    ctx.fillRect((100 - EZ_DEPTH) * SCALE_X, 0, EZ_DEPTH * SCALE_X, COURT_H);

    // Center line
    ctx.strokeStyle = '#3a4060';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(COURT_W / 2, 0);
    ctx.lineTo(COURT_W / 2, COURT_H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Court border
    ctx.strokeStyle = '#4a5070';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, COURT_W - 2, COURT_H - 2);

    // ── Ball rendering ──────────────────────────────────────────────
    // In-flight: arc with height offset + trail. Loose: pulsing dot.
    // Held: golden dot with carrier highlight (drawn in agent loop below).
    const [bsx, bsy] = toScreen(matchState.ballX, matchState.ballY);

    if (matchState.ballState === 'in_flight') {
      // Ball is in flight from a kick/handball — render as an arc with
      // height offset and a trail showing direction of travel.
      const heightOffset = matchState.ballHeight * 8; // Scale height to pixels

      // Trail: line from current position backward along velocity
      const trailLen = 30;
      const vMag = Math.hypot(matchState.ballVelocityX, matchState.ballVelocityY);
      if (vMag > 0.1) {
        const trailDx = -(matchState.ballVelocityX / vMag) * trailLen;
        const trailDy = -(matchState.ballVelocityY / vMag) * trailLen;
        const gradient = ctx.createLinearGradient(
          bsx + trailDx, bsy + trailDy - heightOffset,
          bsx, bsy - heightOffset,
        );
        gradient.addColorStop(0, 'rgba(251,191,36,0.0)');
        gradient.addColorStop(1, 'rgba(251,191,36,0.6)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(bsx + trailDx, bsy + trailDy - heightOffset);
        ctx.lineTo(bsx, bsy - heightOffset);
        ctx.stroke();
      }

      // Shadow on the ground (shows where the ball will land)
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(bsx, bsy, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ball at height — larger and brighter than the flat dot
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(bsx, bsy - heightOffset, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (matchState.ballState === 'loose') {
      // Loose ball on the ground — pulsing orange dot
      const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 200);
      ctx.fillStyle = `rgba(251,191,36,${pulse})`;
      ctx.beginPath();
      ctx.arc(bsx, bsy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      // Held — flat golden dot (carrier highlight drawn in agent loop)
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(bsx, bsy, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Agent health bars and labels (drawn on canvas, under SVG overlays)
    for (const agent of matchState.agents) {
      // down_salvage: keep rendering the health bar during the visible beat
      const animState = animStateRef.current[agent.id];
      const inDownSalvage = animState && animState.downSalvageRemaining > 0;
      if ((agent.status === 'down' || agent.status === 'subbed') && !inDownSalvage) continue;
      const [ax, ay] = toScreen(agent.x, agent.y);
      const r = AGENT_RENDER_SIZE / 2;

      // Ball carrier highlight ring
      if (agent.hasBall) {
        ctx.beginPath();
        ctx.arc(ax, ay, r + 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(251,191,36,0.3)';
        ctx.fill();
      }

      // Team-color ring around agent
      ctx.beginPath();
      ctx.arc(ax, ay, r, 0, Math.PI * 2);
      ctx.strokeStyle = agent.team === 'player' ? '#3b82f6' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Health bar
      const hpFrac = agent.health / agent.maxHealth;
      ctx.fillStyle = '#333';
      ctx.fillRect(ax - r, ay + r + 3, r * 2, 4);
      ctx.fillStyle = hpFrac > 0.5 ? '#34d399' : hpFrac > 0.25 ? '#fbbf24' : '#ef4444';
      ctx.fillRect(ax - r, ay + r + 3, r * 2 * hpFrac, 4);

      // Role label
      ctx.fillStyle = '#ddd';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(agent.role.toUpperCase().slice(0, 4), ax, ay + r + 16);

      // Name
      ctx.fillStyle = '#aaa';
      ctx.font = '9px sans-serif';
      ctx.fillText(agent.name, ax, ay - r - 4);
    }
  }, [matchState, decayAnimState]);

  if (!isActive) {
    return (
      <div className="match-placeholder">
        <p>No active match.</p>
        <p className="mbb-hint">Go to Roster tab to field your squad and start a match.</p>
      </div>
    );
  }

  return (
    <div className="match-wrap">
      {matchState && (
        <div className="match-scoreboard">
          <span className="score-label">YOU</span>
          <span className="score-val">{matchState.scorePlayer}</span>
          <span className="score-time">
            {Math.floor(matchState.timeRemaining / 60)}:
            {String(Math.floor(matchState.timeRemaining) % 60).padStart(2, '0')}
          </span>
          <span className="score-val">{matchState.scoreOpponent}</span>
          <span className="score-label">OPP</span>
          <span className="timeout-indicator">
            {Array(matchState.timeoutsLeft).fill('◆').join(' ')}
          </span>
        </div>
      )}

      <div className="match-canvas-wrap" style={{ position: 'relative', width: COURT_W, height: COURT_H }}>
        <canvas ref={canvasRef} width={COURT_W} height={COURT_H}
                className="match-canvas" style={{ position: 'absolute', top: 0, left: 0 }} />

        {/* SVG PaperDoll overlays for each agent — positioned via CSS transform */}
        {matchState?.agents.map(agent => {
          // down_salvage: keep rendering the agent during the visible beat
          const animState = animStateRef.current[agent.id];
          const inDownSalvage = animState && animState.downSalvageRemaining > 0;
          if ((agent.status === 'down' || agent.status === 'subbed') && !inDownSalvage) return null;

          const [ax, ay] = toScreen(agent.x, agent.y);
          const parts = agentPartsMap[agent.id];
          const facing = agent.team === 'player' ? 'side_right' : 'side_left';
          const animation = deriveAnimation(agent);

          return (
            <div
              key={agent.id}
              className="match-agent-overlay"
              style={{
                position: 'absolute',
                left: ax - AGENT_RENDER_SIZE / 2,
                top: ay - AGENT_RENDER_SIZE / 2,
                width: AGENT_RENDER_SIZE,
                height: AGENT_RENDER_SIZE,
                pointerEvents: 'none',
                // Stunned agents are semi-transparent (existing behavior,
                // preserved). down_salvage agents fade out during the beat.
                opacity: agent.status === 'stunned' ? 0.5
                  : inDownSalvage ? Math.max(0.2, animState.downSalvageRemaining / DOWN_SALVAGE_FRAMES)
                  : 1,
              }}
            >
              {parts ? (
                <PaperDoll
                  parts={parts}
                  size={AGENT_RENDER_SIZE}
                  seed={agent.id.charCodeAt(0)}
                  facing={facing as 'side_right' | 'side_left'}
                  animation={animation}
                  animationT={(Date.now() / 1000) % 1}
                />
              ) : (
                // Fallback for flat-stat opponents without parts
                <div style={{
                  width: AGENT_RENDER_SIZE,
                  height: AGENT_RENDER_SIZE,
                  borderRadius: '50%',
                  background: agent.color,
                  border: `2px solid ${agent.team === 'player' ? '#3b82f6' : '#ef4444'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  color: '#ddd',
                  fontFamily: 'monospace',
                }}>
                  {agent.name.slice(0, 4).toUpperCase()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showSubModal && (
        <Modal title="Mutant Down" showClose={false}>
          <p>Choose a bench replacement or continue without substitution.</p>
          <button onClick={() => {
            sim.resumeMatch();
            setShowSubModal(false);
          }}>Continue Without Sub</button>
        </Modal>
      )}

      <div className="match-controls">
        <button
          className="timeout-btn"
          disabled={!matchState || matchState.timeoutsLeft <= 0}
          onClick={() => {
            sim.callTimeout();
            setShowSubModal(true);
          }}
        >
          Timeout ({matchState?.timeoutsLeft ?? 0})
        </button>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────

function makeAnimState(): AgentAnimState {
  return {
    attackFrames: 0,
    blockFrames: 0,
    celebrationFrames: 0,
    fleeStartledFrames: 0,
    downSalvageRemaining: 0,
  };
}
