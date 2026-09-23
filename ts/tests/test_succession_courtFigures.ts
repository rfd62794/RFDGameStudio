import { describe, it, expect } from 'vitest';
import { COURT_FIGURES } from '../src/games/succession/data/courtFigures';
import type { FigureId } from '../src/games/succession/engine/types';

const FIGURE_IDS: FigureId[] = ['chancellor', 'archbishop', 'commander'];

describe('Court Figures Data', () => {
  it('defines exactly one entry per FigureId', () => {
    // Consumers index COURT_FIGURES[figure.id] with no undefined guard
    // (e.g. meta.avatarIcon in FigureCard), so every FigureId must resolve.
    expect(Object.keys(COURT_FIGURES).sort()).toEqual([...FIGURE_IDS].sort());
    FIGURE_IDS.forEach((id) => {
      expect(COURT_FIGURES[id]).toBeDefined();
    });
  });

  it('each entry id matches its record key', () => {
    // Lookups are always by figure.id; a drifted key/id pair would render
    // coherent-looking but wrong metadata under another figure's card.
    FIGURE_IDS.forEach((id) => {
      expect(COURT_FIGURES[id].id).toBe(id);
    });
  });

  it('every rendered field is a non-empty string', () => {
    // ChamberStage/AudienceStage render all of these directly with no fallback.
    FIGURE_IDS.forEach((id) => {
      const figure = COURT_FIGURES[id];
      expect(figure.name.trim().length).toBeGreaterThan(0);
      expect(figure.title.trim().length).toBeGreaterThan(0);
      expect(figure.domain.trim().length).toBeGreaterThan(0);
      expect(figure.description.trim().length).toBeGreaterThan(0);
      expect(figure.avatarIcon.trim().length).toBeGreaterThan(0);
      expect(figure.agenda.trim().length).toBeGreaterThan(0);
      expect(figure.demand.trim().length).toBeGreaterThan(0);
      expect(figure.mysteryInquiry.trim().length).toBeGreaterThan(0);
    });
  });

  it('every name yields a second-word short name used in headlines', () => {
    // telegraphedRumors, TurnInterlude and EvidencePanel call
    // name.split(' ')[1] to produce a short display name; a single-word
    // name would interpolate undefined into ticker headlines.
    FIGURE_IDS.forEach((id) => {
      const shortName = COURT_FIGURES[id].name.split(' ')[1];
      expect(shortName).toBeTruthy();
    });
  });

  it('avatarIcon values are all handled by the component icon switches', () => {
    // FigureCard and AudienceStage switch on exactly these three names and
    // silently fall back to Crown for anything else.
    const handledIcons = ['Crown', 'Sparkles', 'Shield'];
    FIGURE_IDS.forEach((id) => {
      expect(handledIcons).toContain(COURT_FIGURES[id].avatarIcon);
    });
  });

  it('identities match the names rival rumor flavor text refers to', () => {
    // telegraphedRumors hardcodes "Chancellor Hector", "Archbishop Valerius"
    // and "General Brand" in its flavor strings alongside the figure lookup.
    expect(COURT_FIGURES.chancellor.name).toContain('Hector');
    expect(COURT_FIGURES.archbishop.name).toContain('Valerius');
    expect(COURT_FIGURES.commander.name).toContain('Brand');
  });
});
