/**
 * SVG Chess Piece Silhouettes and Crest Badges
 */

import React from 'react';
import { UnitArchetype, RankTier } from '../types';

interface ChessIconProps {
  type: UnitArchetype | 'crown' | 'scar' | 'lock' | 'shield';
  className?: string;
  size?: number;
}

export const ChessIcon: React.FC<ChessIconProps> = ({ type, className = 'w-6 h-6', size }) => {
  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  switch (type) {
    case 'pawn':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
          {/* Pawn silhouette */}
          <path d="M12 2a3 3 0 0 0-3 3c0 .8.3 1.5.8 2H9a2 2 0 0 0-2 2v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9a2 2 0 0 0-2-2h-.8c.5-.5.8-1.2.8-2a3 3 0 0 0-3-3zm-3 12a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H9zm-4 7a1 1 0 0 0-1 1v1h16v-1a1 1 0 0 0-1-1H5z" />
        </svg>
      );

    case 'knight':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
          {/* Horse Knight silhouette */}
          <path d="M19 22H5v-2a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2zM6 18c0-2 1-3.5 2.5-4.5.5-.3.5-.8.2-1.3l-1.2-2.1C7 9.3 7.3 8.3 8.2 8c1.3-.4 2.8.2 3.4 1.4l.6 1.2c.2.4.7.6 1.1.4l2.1-.8c.9-.3 1.9.1 2.3 1l1.1 2.2c.4.8.2 1.8-.5 2.3L15 18H6zm7-14a3 3 0 0 0-3 3c0 1.2.7 2.2 1.7 2.7l1.1-2.2c.3-.6 1-.9 1.6-.7l.6.2C15 5.5 14.1 4 13 4z" />
        </svg>
      );

    case 'bishop':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
          {/* Bishop mitre silhouette */}
          <path d="M12 2a1.5 1.5 0 0 0-1.5 1.5c0 .5.2.9.6 1.2C9.4 6 8 8 8 11a4 4 0 0 0 2 3.5V17a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2.5a4 4 0 0 0 2-3.5c0-3-1.4-5-3.1-6.3.4-.3.6-.7.6-1.2A1.5 1.5 0 0 0 12 2zm-1 7h2v2h-2V9zm-3 10a1 1 0 0 0-1 1v2h12v-2a1 1 0 0 0-1-1H8z" />
        </svg>
      );

    case 'rook':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
          {/* Rook tower silhouette */}
          <path d="M5 3h3v2h2V3h4v2h2V3h3v5a1 1 0 0 1-1 1h-1v5h1a1 1 0 0 1 1 1v4H4v-4a1 1 0 0 1 1-1h1V9H5a1 1 0 0 1-1-1V3zm4 11h6v-3H9v3z" />
        </svg>
      );

    case 'queen':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
          {/* Queen spiked crown silhouette */}
          <path d="M4 18h16v3H4v-3zm0-2 2-9 4 4 2-7 2 7 4-4 2 9H4zm8-13a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM4.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm15 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
        </svg>
      );

    case 'crown':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
        </svg>
      );

    case 'scar':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
          {/* Scarred emblem */}
          <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-5.45 8-12V5l-8-3zm1 14.5l-2 2-1.5-1.5 2-2 1.5 1.5zm3-5l-6 6-1.5-1.5 6-6 1.5 1.5zm1-3.5l-2 2-1.5-1.5 2-2 1.5 1.5z" />
        </svg>
      );

    case 'lock':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
        </svg>
      );

    default:
      return null;
  }
};

export const RankBadge: React.FC<{ rank: RankTier; className?: string }> = ({ rank, className = '' }) => {
  switch (rank) {
    case 'elite':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm ${className}`}
        >
          <span className="text-amber-400">★ ★</span> ELITE
        </span>
      );
    case 'veteran':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-sm ${className}`}
        >
          <span className="text-blue-400">★</span> VETERAN
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 ${className}`}>
          RECRUIT
        </span>
      );
  }
};
