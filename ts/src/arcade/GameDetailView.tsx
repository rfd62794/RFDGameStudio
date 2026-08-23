import type { GameConfig } from '../engine/types';
import { Modal, Badge } from '../ui/components';
import gameMetadata from '../games/game-metadata.json';
import { loadPatchNotes } from '../games/patchNotesLoader';

// Real per-game metadata joined by gameId. `genre`/`tags`/descriptions/
// `patchNotesPath` are authoritative on GameConfig (version-controlled,
// hand-curated); `game-metadata.json` is the real, git-derived source
// for `created`/`last_updated`/`version` only — it is not read for
// genre/tags here, to avoid two sources of truth silently diverging.
type GameMetadataEntry = {
  created?: string;
  last_updated?: string;
  version?: string;
  tracked?: boolean;
  pipeline_stage?: string;
};
const GAME_METADATA = gameMetadata as Record<string, GameMetadataEntry>;

const GENRE_LABELS: Record<string, string> = {
  'creature-collector': 'Creature Collector',
  'combat-arena': 'Combat Arena',
  'economic-precarity': 'Economic Precarity',
  'colony-4x': 'Colony/4X',
  'idle-incremental': 'Idle/Incremental',
  'roguelike': 'Roguelike',
  'racing': 'Racing',
  'puzzle-stealth': 'Puzzle/Stealth',
  'cooperative': 'Cooperative',
  'narrative-persuasion': 'Narrative/Persuasion',
  'management-sim': 'Management/Sim',
};

/**
 * Real fallback chain for description text: longDescription → shortDescription
 * → description → empty. Exported standalone so it can be unit-tested
 * directly without mounting the component.
 */
export function resolveDetailDescription(config: GameConfig): string {
  return config.longDescription || config.shortDescription || config.description || '';
}

interface GameDetailViewProps {
  config: GameConfig;
  onClose: () => void;
}

export function GameDetailView({ config, onClose }: GameDetailViewProps) {
  const metadata = GAME_METADATA[config.gameId];
  const description = resolveDetailDescription(config);
  const patchNotes = config.patchNotesPath ? loadPatchNotes(config.patchNotesPath) : null;
  const patchNotesFailed = Boolean(config.patchNotesPath) && patchNotes === null;

  return (
    <Modal title={config.label} onClose={onClose}>
      <div data-testid="game-detail-view" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {(config.genre || (config.tags && config.tags.length > 0)) && (
          <div data-testid="game-detail-genre-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {config.genre && <Badge label={GENRE_LABELS[config.genre] ?? config.genre} variant="accent" />}
            {config.tags?.map(tag => <Badge key={tag} label={tag} variant="muted" />)}
          </div>
        )}

        {description && (
          <p data-testid="game-detail-description" style={{ margin: 0, lineHeight: 1.5 }}>
            {description}
          </p>
        )}

        {metadata?.last_updated && (
          <p data-testid="game-detail-last-updated" style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted, #888)' }}>
            Last updated: {metadata.last_updated}
          </p>
        )}

        {config.patchNotesPath && (
          <div data-testid="game-detail-patch-notes">
            <h3 style={{ fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>Patch Notes</h3>
            {patchNotesFailed ? (
              <p data-testid="game-detail-patch-notes-unavailable" style={{ margin: 0, color: 'var(--red, #ef4444)', fontSize: '0.875rem' }}>
                Patch notes unavailable — expected file at {config.patchNotesPath} could not be loaded.
              </p>
            ) : (
              <pre data-testid="game-detail-patch-notes-content" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.8125rem', lineHeight: 1.5, margin: 0, maxHeight: '40vh', overflowY: 'auto' }}>
                {patchNotes}
              </pre>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
