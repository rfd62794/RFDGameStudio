// new: ts/src/games/scrapcrawl/components/RunEndScreen.tsx
import { EndStateScreen } from '../../../ui/components';
import type { RunProgress } from '../utils/runEnd';

export default function RunEndScreen(props: {
  run: RunProgress;
  totalRooms: number;
  scrap: number;
  onRestart: () => void;
}) {
  const { run, totalRooms, scrap, onRestart } = props;
  const won = run.outcome === 'won';
  return (
    <EndStateScreen
      id="scrapcrawl-run-end"
      won={won}
      headline={won ? 'Crawl Complete' : 'Run Over'}
      flavorLine={
        won
          ? 'Every fight room in the crawl is cleared. The scrap is yours.'
          : 'The crawler fell in the dark between the rooms.'
      }
      stats={[
        { label: 'Rooms cleared', value: `${run.clearedRoomIds.length} / ${totalRooms}` },
        { label: 'HP', value: `${run.hp} / ${run.maxHp}` },
        { label: 'Scrap', value: scrap },
      ]}
      restartLabel="Restart"
      onRestart={onRestart}
    />
  );
}
