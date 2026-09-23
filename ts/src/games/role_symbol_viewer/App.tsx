import React, { useState } from 'react';
import type { GameRendererProps } from '../../engine/types';
import {
  PERSON_ARCHETYPES,
  PersonArchetype,
  generateRoleSymbol,
  archetypePalette,
} from '../../engine/shared/personGenerator';
import { RoleSymbol } from '../../engine/shared/personGenerator/RoleSymbol';
import { FIGURE_ARCHETYPE_MAP } from '../succession/data/figureArchetypeMap';

/**
 * Arcade wrapper + standalone verification surface for the shared person
 * generator v1 (role symbols). Matches the character_viewer / technique_showcase
 * registry pattern: a real, reachable preview so the visual result can be
 * verified without touching any live game's UI.
 *
 * Renders all five archetypes side by side, with a seed slider that drives
 * the deterministic variation in generateRoleSymbol, plus the Succession
 * cast mapping (read-only display — no live Succession component is touched).
 */
export default function RoleSymbolViewerApp(_props: GameRendererProps): React.ReactElement {
  const [seed, setSeed] = useState(1);

  return (
    <div style={{ padding: '2rem', color: 'var(--text)', fontFamily: 'var(--font)', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-2xl)', marginBottom: '0.25rem' }}>
        Role Symbol Viewer
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Shared person generator v1 — archetype → SVG shape / charge / palette. Five real archetypes.
      </p>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>Seed</span>
        <input
          type="range"
          min={0}
          max={99}
          value={seed}
          onChange={(e) => setSeed(Number(e.target.value))}
        />
        <code style={{ color: 'var(--accent)' }}>{seed}</code>
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
        {PERSON_ARCHETYPES.map((a) => {
          const spec = generateRoleSymbol(a, seed);
          return (
            <div
              key={a}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <RoleSymbol spec={spec} size={72} label={a} />
              <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{a}</div>
              <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                {spec.shape} · {spec.defaultPalette}
              </code>
            </div>
          );
        })}
      </div>

      <h2 style={{ marginTop: '2rem', fontSize: 'var(--font-size-lg)' }}>Succession cast mapping</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
        First real consumer (mapping only — not wired into live Succession UI this phase).
      </p>
      <SuccessionCastGrid seed={seed} />

      <h2 style={{ marginTop: '2rem', fontSize: 'var(--font-size-lg)' }}>Token-sourced base palettes</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
        {PERSON_ARCHETYPES.map((a) => (
          <div key={a} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 16, height: 16, borderRadius: 4, background: archetypePalette(a), display: 'inline-block' }} />
            <span style={{ textTransform: 'capitalize' }}>{a}</span>
            <code style={{ color: 'var(--text-muted)' }}>{archetypePalette(a)}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuccessionCastGrid({ seed }: { seed: number }): React.ReactElement {
  // The mapping is imported at module top (not in any live Succession
  // component) for the preview only. This is the sole consumer this phase.
  const entries: Array<{ id: string; archetype: PersonArchetype }> = Object.entries(
    FIGURE_ARCHETYPE_MAP,
  ).map(([id, archetype]) => ({ id, archetype }));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
      {entries.map(({ id, archetype }) => {
        const spec = generateRoleSymbol(archetype, seed);
        return (
          <div
            key={id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <RoleSymbol spec={spec} size={64} label={`${id} (${archetype})`} />
            <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{id}</div>
            <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>→ {archetype}</code>
          </div>
        );
      })}
    </div>
  );
}
