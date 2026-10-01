import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

/*
 * The content files are edited by hand after handoff, so these tests guard the
 * invariants Astro's schemas cannot express: unique ids, cross-references that
 * actually resolve, and the small formatting slips that break a build.
 */

const CONTENT = 'src/content';

function frontmatter(path: string): Record<string, unknown> {
  const raw = readFileSync(path, 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  expect(match, `${path} is missing a frontmatter block`).not.toBeNull();
  return parse(match![1]) ?? {};
}

function collection(name: string): { slug: string; path: string }[] {
  return readdirSync(join(CONTENT, name))
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
    .map((file) => ({ slug: file.replace(/\.mdx?$/, ''), path: join(CONTENT, name, file) }));
}

const publications = parse(readFileSync('src/data/publications.yaml', 'utf8')) as Record<
  string,
  any
>[];
const projects = collection('projects');
const people = collection('people');
const news = collection('news');

describe('publications.yaml', () => {
  it('parses as a list of entries', () => {
    expect(Array.isArray(publications)).toBe(true);
    expect(publications.length).toBeGreaterThan(0);
  });

  it.each(['id', 'title', 'authors', 'venue', 'year'])(
    'gives every entry a %s',
    (field) => {
      for (const pub of publications) {
        expect(pub[field], `${pub.id ?? '(no id)'} is missing ${field}`).toBeDefined();
      }
    },
  );

  // A duplicate id silently overwrites an entry in Astro's content store.
  it('uses a unique id for every entry', () => {
    const ids = publications.map((pub) => pub.id);
    expect(ids).toHaveLength(new Set(ids).size);
  });

  it('lists at least one author per entry', () => {
    for (const pub of publications) {
      expect(Array.isArray(pub.authors)).toBe(true);
      expect(pub.authors.length, `${pub.id} has no authors`).toBeGreaterThan(0);
    }
  });

  it('gives every entry a plausible four-digit year', () => {
    for (const pub of publications) {
      expect(typeof pub.year, `${pub.id} year must be a number`).toBe('number');
      expect(pub.year).toBeGreaterThan(1950);
      expect(pub.year).toBeLessThan(2100);
    }
  });

  it('only uses known publication types', () => {
    const allowed = ['journal', 'conference', 'workshop', 'preprint', 'thesis', 'patent'];
    for (const pub of publications) {
      if (pub.type !== undefined) expect(allowed).toContain(pub.type);
    }
  });

  // A reference to a missing project fails the Astro build with an opaque error.
  it('only references research areas that exist', () => {
    const slugs = projects.map((p) => p.slug);
    for (const pub of publications.filter((p) => p.project)) {
      expect(slugs, `${pub.id} references a missing project`).toContain(pub.project);
    }
  });

  it('stores a bare doi rather than a url', () => {
    for (const pub of publications.filter((p) => p.doi)) {
      expect(pub.doi, `${pub.id} doi should not include a host`).not.toMatch(/^https?:/);
      expect(pub.doi).toMatch(/^10\./);
    }
  });

  it('marks lab members with balanced asterisks', () => {
    for (const pub of publications) {
      for (const author of pub.authors as string[]) {
        const stars = (author.match(/\*\*/g) ?? []).length;
        expect(stars % 2, `${pub.id}: unbalanced asterisks around "${author}"`).toBe(0);
      }
    }
  });
});

describe('people', () => {
  it('has at least one entry', () => {
    expect(people.length).toBeGreaterThan(0);
  });

  it('gives everyone a name and a known role', () => {
    const roles = ['pi', 'postdoc', 'grad', 'undergrad', 'staff', 'alum', 'collaborator'];
    for (const { path } of people) {
      const data = frontmatter(path);
      expect(data.name, `${path} is missing a name`).toBeTruthy();
      expect(roles, `${path} has an unknown role`).toContain(data.role);
    }
  });

  it('uses url-safe filenames, since they become page addresses', () => {
    for (const { slug, path } of people) {
      expect(slug, `${path} should be lowercase and hyphenated`).toMatch(
        /^[a-z0-9]+(-[a-z0-9]+)*$/,
      );
    }
  });

  it('gives alumni their current affiliation', () => {
    for (const { path } of people) {
      const data = frontmatter(path);
      if (data.role === 'alum') {
        expect(data.currentAffiliation ?? data.yearsInLab, `${path} alum needs context`)
          .toBeTruthy();
      }
    }
  });

  it('uses a numeric sort order where one is given', () => {
    for (const { path } of people) {
      const data = frontmatter(path);
      if (data.order !== undefined) expect(typeof data.order).toBe('number');
    }
  });
});

describe('news', () => {
  it('gives every post a title and a real date', () => {
    for (const { path } of news) {
      const data = frontmatter(path);
      expect(data.title, `${path} is missing a title`).toBeTruthy();
      const date = new Date(data.date as string);
      expect(Number.isNaN(date.valueOf()), `${path} has an unparseable date`).toBe(false);
    }
  });

  it('uses url-safe filenames', () => {
    for (const { slug, path } of news) {
      expect(slug, `${path} should be lowercase and hyphenated`).toMatch(
        /^[a-z0-9]+(-[a-z0-9]+)*$/,
      );
    }
  });
});

describe('research areas', () => {
  it('gives every area a title, a summary, and a known status', () => {
    for (const { path } of projects) {
      const data = frontmatter(path);
      expect(data.title, `${path} is missing a title`).toBeTruthy();
      expect(data.summary, `${path} is missing a summary`).toBeTruthy();
      if (data.status !== undefined) {
        expect(['active', 'completed']).toContain(data.status);
      }
    }
  });

  it('uses url-safe filenames', () => {
    for (const { slug, path } of projects) {
      expect(slug, `${path} should be lowercase and hyphenated`).toMatch(
        /^[a-z0-9]+(-[a-z0-9]+)*$/,
      );
    }
  });
});
