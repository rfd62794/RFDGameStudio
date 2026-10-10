// new: ts/src/games/shoal/utils/reefReport.ts
/** What the player sees when a reef goes silent: a short report and one thing to try next. */
export interface ReefEndSnapshot {
  seed: number;
  ticks: number;
  peakFish: number;
  peakSharks: number;
  peakAlgae: number;
  endAlgae: number;
}

export interface ReefReportStat {
  label: string;
  value: number;
}

export interface ReefReport {
  stats: ReefReportStat[];
  /** One sentence: what happened and one idea for the next reef. */
  nudge: string;
}

export function buildReefReport(s: ReefEndSnapshot): ReefReport {
  let nudge: string;
  if (s.endAlgae === 0) {
    nudge = 'The algae ran out before the school did. Next time, seed algae near the fish early.';
  } else if (s.peakSharks * 4 >= s.peakFish) {
    nudge = 'The sharks outpaced the school. Try a Lush Garden, or drop fewer sharks.';
  } else {
    nudge = 'The school faded with algae to spare. Try dropping fish into open water to restart the cycle.';
  }
  return {
    stats: [
      { label: 'Ticks Survived', value: s.ticks },
      { label: 'Peak Fish', value: s.peakFish },
      { label: 'Peak Sharks', value: s.peakSharks },
      { label: 'Peak Algae', value: s.peakAlgae },
      { label: 'Algae Left', value: s.endAlgae },
      { label: 'Seed', value: s.seed },
    ],
    nudge,
  };
}
