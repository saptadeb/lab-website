import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COLLECTIONS, PUBLICATION_TYPES, ROLES, buildSlug, byName, slugify } from '../public/admin-page/fields.js';
import { COLLECTIONS as WORKER_COLLECTIONS } from '../worker/src/lib.js';

/*
 * The form spec in public/admin-page/fields.js duplicates the content schema in
 * src/content.config.ts. If they drift, the forms write content that fails the
 * build, and the person hitting it is the least equipped to debug it.
 */

const schema = readFileSync('src/content.config.ts', 'utf8');
const fieldNames = (name: string) => byName(name)!.fields.map((f: any) => f.name);

/** Field names declared at the top level of one collection's z.object block. */
function schemaFields(collectionName: string): string[] {
  const start = schema.indexOf(`const ${collectionName} = defineCollection(`);
  expect(start, `${collectionName} not found in the schema`).toBeGreaterThan(-1);
  const own = schema.indexOf('defineCollection(', start);
  const next = schema.indexOf('defineCollection(', own + 1);
  const block = schema.slice(own, next === -1 ? undefined : next);
  return [...block.matchAll(/^ {4,6}(\w+):/gm)].map((m) => m[1]);
}

describe('form spec', () => {
  it('covers every collection the site defines', () => {
    const declared = [...schema.matchAll(/const (\w+) = defineCollection\(/g)].map((m) => m[1]);
    expect(declared.length).toBeGreaterThan(0);
    for (const name of declared) {
      expect(COLLECTIONS.map((c: any) => c.name), `${name} has no form`).toContain(name);
    }
  });

  it('matches the collections the worker is willing to write to', () => {
    expect(COLLECTIONS.map((c: any) => c.name).sort()).toEqual(
      Object.keys(WORKER_COLLECTIONS).sort(),
    );
  });

  // A field the form does not know about is dropped the next time an entry is saved.
  it.each(['news', 'people', 'projects', 'publications'])(
    '%s has a form field for everything in its schema',
    (name) => {
      const declared = schemaFields(name);
      expect(declared.length).toBeGreaterThan(2);
      for (const field of declared) {
        expect(fieldNames(name), `${name}.${field} is missing from the form`).toContain(field);
      }
    },
  );

  it('offers exactly the roles the schema accepts', () => {
    const block = /const ROLES = \[([\s\S]*?)\] as const;/.exec(schema);
    expect(block, 'could not find the ROLES array').not.toBeNull();
    const schemaRoles = [...block![1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(ROLES.map(([value]: any) => value).sort()).toEqual(schemaRoles.sort());
  });

  it('offers exactly the publication types the schema accepts', () => {
    const match = /\.enum\(\[\s*'journal'[^\]]*\]\)/.exec(schema);
    expect(match).not.toBeNull();
    const schemaTypes = [...match![0].matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
    expect(PUBLICATION_TYPES.map(([value]: any) => value).sort()).toEqual(schemaTypes.sort());
  });

  it('offers exactly the project statuses the schema accepts', () => {
    const match = /status:\s*z\s*\n?\s*\.enum\(\[([^\]]*)\]\)/.exec(schema);
    expect(match).not.toBeNull();
    const schemaStatuses = [...match![1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    const status = byName('projects')!.fields.find((f: any) => f.name === 'status') as any;
    expect(status.options.map(([value]: any) => value).sort()).toEqual(schemaStatuses.sort());
  });

  it('marks the fields the schema requires as required', () => {
    const required: Record<string, string[]> = {
      news: ['title', 'date'],
      people: ['name', 'role'],
      projects: ['title', 'summary'],
      publications: ['title', 'authors', 'venue', 'year'],
    };
    for (const [collection, names] of Object.entries(required)) {
      for (const name of names) {
        const field = byName(collection)!.fields.find((f: any) => f.name === name) as any;
        expect(field?.required, `${collection}.${name} should be required`).toBe(true);
      }
    }
  });

  it('keeps the editing page out of search results', () => {
    const page = readFileSync('public/admin-page/index.html', 'utf8');
    expect(page).toMatch(/name="robots"[^>]*noindex/);
  });

  it('ships no credential in the page', () => {
    for (const file of ['index.html', 'app.js', 'fields.js', 'config.js']) {
      const text = readFileSync(`public/admin-page/${file}`, 'utf8');
      // A long hex string here would mean a hash or token had been embedded.
      expect(text, `${file} looks like it contains a secret`).not.toMatch(/[0-9a-f]{40,}/);
      expect(text).not.toMatch(/gh[pousr]_[A-Za-z0-9]{20,}/);
    }
  });

  it('no longer carries the old cms config', () => {
    expect(existsSync('public/admin-page/config.yml')).toBe(false);
  });
});

describe('slugs', () => {
  it('produces url-safe filenames, which become page addresses', () => {
    expect(slugify('A Title: With Punctuation!')).toBe('a-title-with-punctuation');
    expect(slugify('  Spaces  everywhere  ')).toBe('spaces-everywhere');
    expect(slugify('Accented Café')).toBe('accented-cafe');
  });

  it('matches the pattern the content tests enforce', () => {
    for (const title of ['Hello World', 'A: B', 'Ünïcödé, accents & symbols']) {
      expect(slugify(title)).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  // Earlier the year came from the current date, so a 2019 paper filed as 2026.
  it('takes a publication year from the entry, not from today', () => {
    const slug = buildSlug(byName('publications'), { title: 'An Old Paper', year: 2019 });
    expect(slug).toBe('2019-an-old-paper');
  });

  it('builds a person slug from their name', () => {
    expect(buildSlug(byName('people'), { name: 'Jane Q. Doe' })).toBe('jane-q-doe');
  });

  it('returns nothing usable when the source field is empty', () => {
    expect(buildSlug(byName('news'), {})).toBe('');
  });
});
