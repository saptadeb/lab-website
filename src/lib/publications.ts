export interface Filters {
  /** Free-text match against title, authors, and venue. */
  query?: string;
  type?: string;
  topic?: string;
}

/** The searchable haystack for one publication, lowercased. */
export function searchText(pub: {
  title: string;
  authors: string[];
  venue: string;
}): string {
  return `${pub.title} ${pub.authors.join(' ')} ${pub.venue}`.toLowerCase();
}

/**
 * Whether a publication survives the current filters. Shared by the rendered
 * markup and the browser script so both agree on what a match is.
 */
export function matches(
  pub: { search: string; type: string; topics: string[] },
  filters: Filters,
): boolean {
  const query = (filters.query ?? '').trim().toLowerCase();
  if (query && !pub.search.includes(query)) return false;
  if (filters.type && pub.type !== filters.type) return false;
  if (filters.topic && !pub.topics.includes(filters.topic)) return false;
  return true;
}

/** Sorts years for display. Publications are grouped by year, newest first. */
export function sortYears(years: number[], direction: 'asc' | 'desc'): number[] {
  return [...years].sort((a, b) => (direction === 'asc' ? a - b : b - a));
}
