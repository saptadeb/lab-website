import { describe, expect, it } from 'vitest';
import { matches, searchText, sortYears } from '../publications';

const pub = {
  search: searchText({
    title: 'Protein folding at scale',
    authors: ['**Jane Doe**', 'Outside Collaborator'],
    venue: 'Nature',
  }),
  type: 'journal',
  topics: ['folding', 'methods'],
};

describe('searchText', () => {
  it('includes title, authors, and venue, lowercased', () => {
    expect(pub.search).toContain('protein folding at scale');
    expect(pub.search).toContain('jane doe');
    expect(pub.search).toContain('nature');
  });
});

describe('matches', () => {
  it('passes everything when no filters are set', () => {
    expect(matches(pub, {})).toBe(true);
  });

  it('matches a query case-insensitively', () => {
    expect(matches(pub, { query: 'PROTEIN' })).toBe(true);
  });

  it('matches on author and venue, not just title', () => {
    expect(matches(pub, { query: 'jane' })).toBe(true);
    expect(matches(pub, { query: 'nature' })).toBe(true);
  });

  it('rejects a query that appears nowhere', () => {
    expect(matches(pub, { query: 'crystallography' })).toBe(false);
  });

  it('ignores surrounding whitespace in a query', () => {
    expect(matches(pub, { query: '  protein  ' })).toBe(true);
  });

  it('treats a whitespace-only query as no filter', () => {
    expect(matches(pub, { query: '   ' })).toBe(true);
  });

  it('filters by type', () => {
    expect(matches(pub, { type: 'journal' })).toBe(true);
    expect(matches(pub, { type: 'preprint' })).toBe(false);
  });

  it('filters by topic', () => {
    expect(matches(pub, { topic: 'folding' })).toBe(true);
    expect(matches(pub, { topic: 'imaging' })).toBe(false);
  });

  it('requires every active filter to pass, not just one', () => {
    expect(matches(pub, { query: 'protein', type: 'journal' })).toBe(true);
    expect(matches(pub, { query: 'protein', type: 'preprint' })).toBe(false);
    expect(matches(pub, { query: 'nothing', type: 'journal' })).toBe(false);
  });

  it('handles a publication with no topics', () => {
    const untagged = { ...pub, topics: [] };
    expect(matches(untagged, {})).toBe(true);
    expect(matches(untagged, { topic: 'folding' })).toBe(false);
  });
});

describe('sortYears', () => {
  it('sorts newest first by default direction', () => {
    expect(sortYears([2024, 2026, 2025], 'desc')).toEqual([2026, 2025, 2024]);
  });

  it('sorts oldest first when asked', () => {
    expect(sortYears([2024, 2026, 2025], 'asc')).toEqual([2024, 2025, 2026]);
  });

  it('does not mutate the input', () => {
    const years = [2024, 2026];
    sortYears(years, 'asc');
    expect(years).toEqual([2024, 2026]);
  });
});
