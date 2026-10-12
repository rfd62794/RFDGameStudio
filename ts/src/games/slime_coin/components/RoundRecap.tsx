// RoundRecap.tsx — end-of-round recap panel shown above the shop
// <!-- new: ts/src/games/slime_coin/components/RoundRecap.tsx -->
import type { RoundRecap } from '../utils/roundRecap';

interface RoundRecapProps {
  recap: RoundRecap;
}

export default function RoundRecap({ recap }: RoundRecapProps) {
  return (
    <div className="sc-recap">
      <h3 className="sc-recap-headline">{recap.headline}</h3>
      <p className="sc-recap-score">
        Score {recap.score} of target {recap.target}
      </p>
      {recap.fired.length > 0 ? (
        <ul className="sc-recap-list">
          {recap.fired.map((f) => (
            <li key={f.label} className="sc-recap-item">
              <span className="sc-recap-label">{f.label}</span>
              <span className="sc-recap-count">×{f.count}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="sc-recap-empty">No synergies fired this round</p>
      )}
    </div>
  );
}
