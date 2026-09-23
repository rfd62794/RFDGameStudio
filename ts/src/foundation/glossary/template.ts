const PLACEHOLDER = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

/** Names used as {name} in a template, in order of first use. */
export function placeholders(text: string): string[] {
  const seen: string[] = [];
  for (const m of text.matchAll(PLACEHOLDER)) if (!seen.includes(m[1])) seen.push(m[1]);
  return seen;
}

/** Replace each {name} with its value; a missing or null value shows as '?'. */
export function fillTemplate(text: string, values: Record<string, unknown>): string {
  return text.replace(PLACEHOLDER, (_, name: string) => {
    const v = values[name];
    return v === undefined || v === null ? '?' : String(v);
  });
}
