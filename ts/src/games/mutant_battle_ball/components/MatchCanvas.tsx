import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGameLoop } from '../../../hooks';
import { Modal } from '../../../ui/components';
import type { MatchState, MatchAgent } from '../types';

const COURT_W = 700;
const COURT_H = 400;
const SCALE_X = COURT_W / 100;
const SCALE_Y = COURT_H / 60;
const EZ_DEPTH = 10;

function toScreen(gx: number, gy: number): [number, number] {
  return [gx * SCALE_X, gy * SCALE_Y];
}

interface MatchCanvasProps {
  session: unknown;
  call: (fn: string, ...args: unknown[]) => unknown;
  isActive: boolean;
  state: unknown;
  setState: (fn: (prev: unknown) => unknown) => void;
  onMatchEnd: (finalState: MatchState) => void;
}

export default function MatchCanvas(
  { session, call, isActive, state, setState, onMatchEnd }: MatchCanvasProps
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [downAgentId, setDownAgentId] = useState<string | null>(null);
  const matchStateRef = useRef<MatchState | null>(null);

  const tick = useCallback((dt: number) => {
    if (!isActive) return;
    const raw = call('tick_match', dt) as Record<string, unknown> | null;
    if (!raw) return;

    const ms: MatchState = {
      agents: (raw['agents'] as Array<Record<string, unknown>>)?.map(a => ({
        id:        a['id'] as string,
        name:      a['name'] as string,
        team:      a['team'] as 'player' | 'opponent',
        color:     a['color'] as string,
        x:         a['x'] as number,
        y:         a['y'] as number,
        role:      a['role'] as MatchAgent['role'],
        status:    a['status'] as MatchAgent['status'],
        hasBall:   a['has_ball'] as boolean,
        health:    a['health'] as number,
        maxHealth: a['max_health'] as number,
      })) ?? [],
      ballX:          raw['ball_x'] as number,
      ballY:          raw['ball_y'] as number,
      possession:     raw['possession'] as 'player' | 'opponent',
      scorePlayer:    raw['score_player'] as number,
      scoreOpponent:  raw['score_opponent'] as number,
      timeRemaining:  raw['time_remaining'] as number,
      timeoutsLeft:   raw['timeouts_left'] as number,
      state:          raw['state'] as MatchState['state'],
      events:         (raw['events'] as Array<Record<string, unknown>>) ?? [],
    };

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
  }, [isActive, call, onMatchEnd]);

  useGameLoop(tick, { paused: !isActive || showSubModal });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !matchState) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1d27';
    ctx.fillRect(0, 0, COURT_W, COURT_H);

    ctx.fillStyle = '#2a3040';
    ctx.fillRect(0, 0, COURT_W, COURT_H);

    ctx.fillStyle = 'rgba(239,68,68,0.15)';
    ctx.fillRect(0, 0, EZ_DEPTH * SCALE_X, COURT_H);
    ctx.fillStyle = 'rgba(59,130,246,0.15)';
    ctx.fillRect((100 - EZ_DEPTH) * SCALE_X, 0, EZ_DEPTH * SCALE_X, COURT_H);

    ctx.strokeStyle = '#3a4060';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(COURT_W / 2, 0);
    ctx.lineTo(COURT_W / 2, COURT_H);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#4a5070';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, COURT_W - 2, COURT_H - 2);

    const [bsx, bsy] = toScreen(matchState.ballX, matchState.ballY);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(bsx, bsy, 8, 0, Math.PI * 2);
    ctx.fill();

    for (const agent of matchState.agents) {
      if (agent.status === 'down' || agent.status === 'subbed') continue;
      const [ax, ay] = toScreen(agent.x, agent.y);
      const r = 16;

      if (agent.hasBall) {
        ctx.beginPath();
        ctx.arc(ax, ay, r + 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(251,191,36,0.3)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(ax, ay, r, 0, Math.PI * 2);
      ctx.fillStyle = agent.status === 'stunned' ? '#555' : agent.color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(ax, ay, r, 0, Math.PI * 2);
      ctx.strokeStyle = agent.team === 'player' ? '#3b82f6' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();

      const hpFrac = agent.health / agent.maxHealth;
      ctx.fillStyle = '#333';
      ctx.fillRect(ax - r, ay + r + 3, r * 2, 4);
      ctx.fillStyle = hpFrac > 0.5 ? '#34d399' : hpFrac > 0.25 ? '#fbbf24' : '#ef4444';
      ctx.fillRect(ax - r, ay + r + 3, r * 2 * hpFrac, 4);

      ctx.fillStyle = '#ddd';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(agent.role.toUpperCase().slice(0, 4), ax, ay + 4);

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

      <canvas ref={canvasRef} width={COURT_W} height={COURT_H}
              className="match-canvas" />

      {showSubModal && (
        <Modal title="Mutant Down" showClose={false}>
          <p>Choose a bench replacement or continue without substitution.</p>
          <button onClick={() => {
            call('resume_match');
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
            call('call_timeout');
            setShowSubModal(true);
          }}
        >
          Timeout ({matchState?.timeoutsLeft ?? 0})
        </button>
      </div>
    </div>
  );
}
