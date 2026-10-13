import type { RoundRecap } from '../utils/roundRecap';

interface RoundRecapProps {
  recap: RoundRecap;
}

export default function RoundRecap({ recap }: RoundRecapProps) {
  return (
    <div className="sc-round-recap">
      <p className="sc-recap-headline">{recap.headline}</p>
      <p className="sc-recap-score">{`Score ${recap.score} of target ${recap.target}`}</p>
      {recap.fired.length > 0 ? (
        <ul className="sc-recap-fired">
          {recap.fired.map((f) => (
            <li key={f.label}>
              <span className="sc-recap-label">{f.label}</span>
              <span className="sc-recap-count">{`x${f.count}`}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="sc-recap-empty">No synergies fired this round</p>
      )}
    </div>
  );
}
