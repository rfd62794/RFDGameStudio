// new: ts/src/games/mutant_battle_ball/tabs.ts
// The tabs a player can open. A tab joins this list only when something real is behind it.
// Infirmary is NOT here on purpose: components/InfirmaryTab.tsx is a stub (a heading and one
// sentence). Restore { id: 'infirmary', label: 'Infirmary', shortcut: '5' } when it is built.
export interface MbbTab {
  id: string;
  label: string;
  shortcut: string;
}

export const TABS: readonly MbbTab[] = [
  { id: 'roster', label: 'Roster', shortcut: '1' },
  { id: 'workshop', label: 'Workshop', shortcut: '2' },
  { id: 'match', label: 'Match', shortcut: '3' },
  { id: 'shop', label: 'Shop', shortcut: '4' },
];
