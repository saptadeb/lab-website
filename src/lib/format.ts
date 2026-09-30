/** Formats a date for display, e.g. "14 March 2026". */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** ISO date for <time datetime>. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Author lists mark lab members with **Name**. Returns segments so the
 * template can bold them without dangerously setting inner HTML.
 */
export function parseAuthors(
  authors: string[],
): { name: string; isLabMember: boolean }[] {
  return authors.map((raw) => {
    const match = /^\*\*(.+)\*\*$/.exec(raw.trim());
    return match
      ? { name: match[1], isLabMember: true }
      : { name: raw.trim(), isLabMember: false };
  });
}

/** Groups any dated/yeared items into descending-year buckets. */
export function groupByYear<T extends { year: number }>(
  items: T[],
): { year: number; items: T[] }[] {
  const map = new Map<number, T[]>();
  for (const item of items) {
    const bucket = map.get(item.year) ?? [];
    bucket.push(item);
    map.set(item.year, bucket);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, items]) => ({ year, items }));
}
