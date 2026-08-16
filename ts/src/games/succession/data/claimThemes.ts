import { ClaimTheme } from '../engine/types';

export const CLAIM_THEMES: ClaimTheme[] = [
  // CHANCELLOR (The Embezzlement & Lineage)
  {
    id: 'noble_pedigree',
    label: 'Claim: The Sole Blood of Valen',
    figureId: 'chancellor',
    opposesThemeId: 'common_origins',
  },
  {
    id: 'common_origins',
    label: 'Claim: The Bastard Named in Secret',
    figureId: 'chancellor',
    opposesThemeId: 'noble_pedigree',
  },

  // ARCHBISHOP (The Divine Right vs Cleansing)
  {
    id: 'divine_favor',
    label: 'Claim: Anointed Under Holy Sacrament',
    figureId: 'archbishop',
    opposesThemeId: 'godless_ambition',
  },
  {
    id: 'godless_ambition',
    label: 'Claim: Reclaiming Church from Heresy',
    figureId: 'archbishop',
    opposesThemeId: 'divine_favor',
  },

  // COMMANDER (The Martial Honor vs Regicide Inquest)
  {
    id: 'battle_tested',
    label: 'Claim: Brother-in-Arms of the Gate',
    figureId: 'commander',
    opposesThemeId: 'reckless_outsider',
  },
  {
    id: 'reckless_outsider',
    label: 'Claim: Unmasking the Gate Conspiracy',
    figureId: 'commander',
    opposesThemeId: 'battle_tested',
  },
];
