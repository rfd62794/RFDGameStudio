// new: ts/src/games/planetofgreed/components/OriginsRow.tsx
import { originLinks, ORIGINS_HEADING } from '../originGames';

interface OriginsRowProps {
  mode: 'arcade' | 'standalone';
}

export function OriginsRow({ mode }: OriginsRowProps) {
  const links = originLinks(mode, window.location.href);
  if (links.length === 0) return null;
  return (
    <div className="mt-6 text-xs text-amber-100/70 font-serif" data-testid="pog-origins-row">
      <p className="italic">{ORIGINS_HEADING}</p>
      <ul className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {links.map((l) => (
          <li key={l.id}>
            <a className="underline text-amber-300 hover:text-amber-200" href={l.href} data-testid={`pog-origin-${l.id}`}>
              {l.label}
            </a>{' '}
            <span>({l.blurb})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
