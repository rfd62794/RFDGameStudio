import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useGameLoop } from '../../../hooks';
import { Modal } from '../../../ui/components';
import { PaperDoll } from '../../../engine/paperDoll';
import type { Part, PartsBySlot } from '../../../engine/shared/partSlots';
import type { Mutant } from '../types';
import type { MatchState } from '../types';
import type { MbbSimulation } from '../simulation/mbbSimulation';

const COURT_W = 700;
const COURT_H = 400;
const SCALE_X = COURT_W / 100;
const SCALE_Y = COURT_H / 60;
const EZ_DEPTH = 10;
const AGENT_RENDER_SIZE = 40;

function toScreen(gx: number, gy: number): [number, number] {
  return [gx * SCALE_X, gy * SCALE_Y];
}

interface MatchCanvasProps {
  session: unknown;
  sim: MbbSimulation;
  isActive: boolean;
  state: unknown;
  setState: (fn: (prev: unknown) => unknown) => void;
  onMatchEnd: (finalState: MatchState) => void;
  playerRoster: Mutant[];
  opponentMutants: Array<Record<string, unknown>>;
}

export default function MatchCanvas(
  { session, sim, isActive, state, setState, onMatchEnd, playerRoster, opponentMutants }: MatchCanvasProps
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [downAgentId, setDownAgentId] = useState<string | null>(null);
  const matchStateRef = useRef<MatchState | null>(null);

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

  const tick = useCallback((dt: number) => {
    if (!isActive) return;
    const ms = sim.tickMatch(dt);
    matchStateRef.current = ms;
    setMatchState(ms);

    for (const ev of ms.events) {
      if (ev['type'] === 'agent_down') {
        setDownAgentId(ev['agent_id'] as string);
        setShowSubModal(true);
      }
      if (ev['type'] === 'match_ended') {
        onMatchEnd(ms);
      }
    }
  }, [isActive, sim, onMatchEnd]);

  useGameLoop(tick, { paused: !isActive || showSubModal });

  // Canvas draws court, ball, health bars — agents are SVG overlays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !matchState) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    // Ball
    const [bsx, bsy] = toScreen(matchState.ballX, matchState.ballY);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(bsx, bsy, 8, 0, Math.PI * 2);
    ctx.fill();

    // Agent health bars and labels (drawn on canvas, under SVG overlays)
    for (const agent of matchState.agents) {
      if (agent.status === 'down' || agent.status === 'subbed') continue;
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
  }, [matchState]);

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
          if (agent.status === 'down' || agent.status === 'subbed') return null;
          const [ax, ay] = toScreen(agent.x, agent.y);
          const parts = agentPartsMap[agent.id];
          const facing = agent.team === 'player' ? 'side_right' : 'side_left';

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
                opacity: agent.status === 'stunned' ? 0.5 : 1,
              }}
            >
              {parts ? (
                <PaperDoll
                  parts={parts}
                  size={AGENT_RENDER_SIZE}
                  seed={agent.id.charCodeAt(0)}
                  facing={facing as 'side_right' | 'side_left'}
                  animation={agent.hasBall ? 'sprint' : 'walk'}
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
            setDownAgentId(null);
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
