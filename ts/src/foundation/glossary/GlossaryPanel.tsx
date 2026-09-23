import { ErrorBox } from '../../ui/components';
import type { LoadResult } from './schema';

/** True when the URL asks for the dev glossary panel (?glossary or ?glossary=1). */
export function glossaryPanelRequested(search: string): boolean {
  return new URLSearchParams(search).has('glossary');
}

/** Dev-only view of a game's glossary: every entry, and every problem found loading it. */
export function GlossaryPanel({ result }: { result: LoadResult }) {
  const entries = result.glossary ? Object.values(result.glossary.entries) : [];
  return (
    <aside className="glossary-panel" aria-label="Glossary (dev)">
      <h2>Glossary</h2>
      {result.issues.map((issue, i) => (
        <ErrorBox key={i} message={`${issue.entry ?? 'glossary'}: ${issue.message}`} />
      ))}
      <ul>
        {entries.map(e => (
          <li key={e.id} data-glossary-entry={e.id}>
            <strong>{e.label}</strong> <code>{e.kind}</code> <code>{e.tone}</code>
            {e.bind && <> <code>{e.bind}</code></>}
          </li>
        ))}
      </ul>
    </aside>
  );
}
