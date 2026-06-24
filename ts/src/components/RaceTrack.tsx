import React from 'react';
import type { RaceResult, CurrentRace } from '../engine/types';

interface Props {
  race: CurrentRace;
  results: RaceResult[];
}

const RANK_LABEL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function RaceTrack({ race, results }: Props) {
  const sorted = [...results].sort((a, b) => a.rank - b.rank);
  const total = race.participants.length;

  return (
    <div className="race-track-wrap">
      <h3 style={{ marginBottom: '0.75rem' }}>
        {race.name} — {race.distance}m · {race.race_class}
      </h3>

      <svg
        viewBox={`0 0 600 ${total * 36 + 24}`}
        style={{ width: '100%', display: 'block', marginBottom: '0.75rem' }}
        aria-label="Race finish order"
      >
        {sorted.map((r, i) => {
          const y = 12 + i * 36;
          const participant = race.participants.find(p => p.horse.id === r.horse_id);
          const silkColor = participant?.horse.color_silk ?? '#6c8ef7';
          const bodyColor = participant?.horse.color_body ?? '#91532B';
          const barW = Math.max(10, 520 - i * 40);

          return (
            <g key={r.horse_id}>
              <rect x={0} y={y} width={barW} height={26} rx={4}
                fill={bodyColor} opacity={0.18} />
              <rect x={0} y={y} width={barW} height={26} rx={4}
                fill="none" stroke={silkColor} strokeWidth={1} opacity={0.4} />
              <rect x={0} y={y} width={32} height={26} rx={4}
                fill={silkColor} opacity={0.85} />
              <text x={16} y={y + 17} textAnchor="middle"
                fontSize={14} fill="#fff" fontWeight="bold">
                {RANK_LABEL[r.rank] ?? r.rank}
              </text>
              <text x={40} y={y + 17} fontSize={12}
                fill={r.player_owned ? '#6c8ef7' : '#e8eaf0'} fontWeight={r.player_owned ? 700 : 400}>
                {r.horse_name}
                {r.player_owned ? ' ★' : ''}
              </text>
              {r.payout > 0 && (
                <text x={590} y={y + 17} textAnchor="end"
                  fontSize={12} fill="#34d399" fontWeight={700}>
                  +${r.payout}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
