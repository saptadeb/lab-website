import { describe, expect, it } from 'vitest';
import { formatDate, groupByYear, isoDate, parseAuthors } from '../format';

describe('formatDate', () => {
  it('formats a date for display', () => {
    expect(formatDate(new Date('2026-03-14T00:00:00Z'))).toBe('March 14, 2026');
  });

  // Content files carry bare dates, which parse as UTC midnight. Formatting in
  // local time would show the previous day for anyone west of Greenwich.
  it('does not shift the day across time zones', () => {
    expect(formatDate(new Date('2026-01-01T00:00:00Z'))).toContain('January 1');
  });
});

describe('isoDate', () => {
  it('returns a date-only ISO string for the datetime attribute', () => {
    expect(isoDate(new Date('2026-03-14T18:30:00Z'))).toBe('2026-03-14');
  });
});

describe('parseAuthors', () => {
  it('marks lab members wrapped in asterisks', () => {
    expect(parseAuthors(['**Jane Doe**', 'Outside Collaborator'])).toEqual([
      { name: 'Jane Doe', isLabMember: true },
      { name: 'Outside Collaborator', isLabMember: false },
    ]);
  });

  it('trims surrounding whitespace', () => {
    expect(parseAuthors(['  Jane Doe  ', '  **Ada Lovelace**  '])).toEqual([
      { name: 'Jane Doe', isLabMember: false },
      { name: 'Ada Lovelace', isLabMember: true },
    ]);
  });

  it('leaves a name containing asterisks mid-string alone', () => {
    expect(parseAuthors(['Jane **Doe'])).toEqual([
      { name: 'Jane **Doe', isLabMember: false },
    ]);
  });

  it('handles an empty list', () => {
    expect(parseAuthors([])).toEqual([]);
  });
});

describe('groupByYear', () => {
  it('groups items into descending year buckets', () => {
    const items = [
      { year: 2024, id: 'a' },
      { year: 2026, id: 'b' },
      { year: 2024, id: 'c' },
    ];
    expect(groupByYear(items)).toEqual([
      { year: 2026, items: [{ year: 2026, id: 'b' }] },
      {
        year: 2024,
        items: [
          { year: 2024, id: 'a' },
          { year: 2024, id: 'c' },
        ],
      },
    ]);
  });

  it('preserves the incoming order within a year', () => {
    const items = [
      { year: 2026, id: 'second' },
      { year: 2026, id: 'first' },
    ];
    expect(groupByYear(items)[0].items.map((i) => i.id)).toEqual(['second', 'first']);
  });

  it('returns nothing for an empty list', () => {
    expect(groupByYear([])).toEqual([]);
  });
});
