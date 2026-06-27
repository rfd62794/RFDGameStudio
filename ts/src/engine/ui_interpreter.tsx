import React from 'react';
import { ResolvedBounds } from './ui_resolver';
import { TabBar, ErrorBox } from '../ui/components';

export interface RegionDeclaration {
  component: string;
  bindings?: Record<string, string>;  // binding_key → dot.path in game state
  tabs_from?: string;                  // path to tabs array in ui.yaml
  text?: string;                       // literal text value
}

export interface RegionsMap {
  [id: string]: RegionDeclaration;
}

/** Resolve a dot-path like "game_state.funds" against a state object */
function getBinding(state: unknown, path: string): unknown {
  if (!path || !state) return undefined;
  return path.split('.').reduce(
    (obj: unknown, key: string) =>
      obj != null && typeof obj === 'object' ? (obj as Record<string, unknown>)[key] : undefined,
    state
  );
}

export interface InterpretedSlot {
  id: string;
  bounds: ResolvedBounds;
  isSlot: true;  // game must render this region itself
}

export type InterpretedResult = React.ReactElement | InterpretedSlot | null;

/**
 * Render a single region at its resolved bounds.
 * Returns a React element for known components.
 * Returns an InterpretedSlot for game-specific slots (canvas, race_track, custom).
 */
export function interpretRegion(
  id: string,
  bounds: ResolvedBounds,
  region: RegionDeclaration,
  gameState: unknown,
  uiState: unknown
): InterpretedResult {
  const { x, y, w, h } = bounds;
  const style: React.CSSProperties = {
    position: 'absolute',
    left: x, top: y, width: w, height: h,
    overflow: 'hidden',
  };

  switch (region.component) {
    case 'app_header': {
      const title = region.bindings?.title
        ?? String(getBinding(gameState, region.bindings?.title_from ?? '') ?? '');
      const bank = getBinding(gameState, region.bindings?.bank ?? '') as number | undefined;
      return (
        <div key={id} style={style} className="ui-region ui-header">
          <span className="ui-header-title">{region.bindings?.title ?? title}</span>
          {bank !== undefined && (
            <span className="ui-header-bank">${bank.toLocaleString()}</span>
          )}
        </div>
      );
    }

    case 'tab_bar': {
      const activeTab = getBinding(uiState, 'activeTab') as string | undefined;
      // tabs_from resolves to the ui.yaml tabs array — passed via uiState
      const tabs = getBinding(uiState, 'tabs') as Array<{id: string; label: string}> | undefined;
      const onSelect = getBinding(uiState, 'onSelectTab') as ((id: string) => void) | undefined;
      if (!tabs) return null;
      return (
        <div key={id} style={style} className="ui-region ui-tab-bar">
          <TabBar tabs={tabs} active={activeTab ?? ''} onSelect={onSelect ?? (() => {})} />
        </div>
      );
    }

    case 'app_footer': {
      return (
        <div key={id} style={style} className="ui-region ui-footer">
          <span>{region.text ?? ''}</span>
        </div>
      );
    }

    case 'hud': {
      // HUD is a slot — game renders its own HUD component at these bounds
      return { id, bounds, isSlot: true };
    }

    // Slot types — game fills these
    case 'canvas':
    case 'race_track':
    case 'tab_content':
    case 'custom':
      return { id, bounds, isSlot: true };

    default:
      return (
        <div key={id} style={{ ...style, background: 'rgba(255,0,0,0.1)' }}>
          <ErrorBox message={`Unknown component: ${region.component}`} />
        </div>
      );
  }
}

/**
 * Interpret all regions in a bounds map.
 * Returns a mix of React elements (rendered) and InterpretedSlots (for game to fill).
 */
export function interpretLayout(
  boundsMap: Record<string, ResolvedBounds>,
  regions: RegionsMap,
  gameState: unknown,
  uiState: unknown
): { elements: React.ReactElement[]; slots: Record<string, InterpretedSlot> } {
  const elements: React.ReactElement[] = [];
  const slots: Record<string, InterpretedSlot> = {};

  for (const [id, region] of Object.entries(regions)) {
    const bounds = boundsMap[id];
    if (!bounds) continue;

    const result = interpretRegion(id, bounds, region, gameState, uiState);
    if (!result) continue;

    if ('isSlot' in result) {
      slots[id] = result;
    } else {
      elements.push(result);
    }
  }

  return { elements, slots };
}
