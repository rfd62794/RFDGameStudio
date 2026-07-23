import React from 'react';
import type { GameRendererProps } from '../../engine/types';

export default function App({ session }: GameRendererProps) {
  const data = session.files.data as Record<string, unknown>;
  const game = (data.game ?? {}) as Record<string, unknown>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">{(game.name as string) ?? 'Dissonance Depths'}</h1>
        <p className="text-sm text-slate-400 mt-1">
          Status: <span className="text-amber-400 font-semibold">DEV</span>
        </p>
      </header>
      <section className="max-w-2xl">
        <p className="mb-4">
          Dissonance Depths is under active development. The Lua runtime, data layer,
          and synergy mechanics are loaded; a playable React renderer is still being
          wired up.
        </p>
        <div className="rounded-lg bg-slate-800 p-4 font-mono text-sm text-slate-300">
          <p>Game ID: {String(game.id)}</p>
          <p>Version: {String(game.version)}</p>
          <p>Studio: {String(game.studio)}</p>
        </div>
      </section>
    </div>
  );
}
