import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

/*
 * The CMS config at public/admin-page/config.yml duplicates the content schema
 * in src/content.config.ts. If the two drift, the CMS writes content that fails
 * the build, and the person hitting it is the least equipped to debug it.
 * These tests pin the overlap.
 */

const config = parse(readFileSync('public/admin-page/config.yml', 'utf8'));
const schema = readFileSync('src/content.config.ts', 'utf8');

type Field = { name: string; widget: string; required?: boolean; fields?: Field[] };
type Collection = {
  name: string;
  folder: string;
  create?: boolean;
  delete?: boolean;
  fields: Field[];
};

const collections: Collection[] = config.collections;
const byName = (name: string) => collections.find((c) => c.name === name)!;
const fieldNames = (name: string) => byName(name).fields.map((f) => f.name);

describe('admin config', () => {
  it('points at this repository', () => {
    expect(config.backend.name).toBe('github');
    expect(config.backend.repo).toBe('saptadeb/lab-website');
  });

  it('covers every content collection the site defines', () => {
    // Collections declared in the Astro schema, e.g. `const people = defineCollection(`.
    const declared = [...schema.matchAll(/const (\w+) = defineCollection\(/g)].map(
      (match) => match[1],
    );
    expect(declared.length).toBeGreaterThan(0);
    for (const name of declared) {
      expect(collections.map((c) => c.name), `${name} is missing from the CMS`).toContain(
        name,
      );
    }
  });

  it('allows creating and deleting entries everywhere', () => {
    for (const collection of collections) {
      expect(collection.create, `${collection.name} cannot create`).toBe(true);
      expect(collection.delete, `${collection.name} cannot delete`).toBe(true);
    }
  });

  it('points every collection at a folder that exists', () => {
    for (const collection of collections) {
      expect(existsSync(collection.folder), `${collection.folder} is missing`).toBe(true);
    }
  });

  // The noindex meta tag is what actually works: robots.txt is only read from a
  // domain root, and this site is served under a base path.
  it('keeps the editing interface out of search engines', () => {
    const page = readFileSync('public/admin-page/index.html', 'utf8');
    expect(page).toMatch(/name="robots"[^>]*noindex/);
  });

  it('disallows the editing interface at both the base path and a bare domain', () => {
    const robots = readFileSync('public/robots.txt', 'utf8');
    expect(robots).toContain('Disallow: /admin-page/');
    expect(robots).toContain('Disallow: /lab-website/admin-page/');
  });

  it('pins the cms bundle to an exact version with an integrity hash', () => {
    const page = readFileSync('public/admin-page/index.html', 'utf8');
    expect(page).toMatch(/@sveltia\/cms@\d+\.\d+\.\d+\//);
    expect(page).toMatch(/sha384-[A-Za-z0-9+/=]{40,}/);
  });

  // A native form submit would put the passphrase in the url and the history.
  it('gives the passphrase inputs no name attributes', () => {
    const page = readFileSync('public/admin-page/index.html', 'utf8');
    expect(page).not.toMatch(/<input[^>]*name="(username|password)"/);
  });

  it('keeps media paths free of the base path, which is environment-driven', () => {
    expect(config.public_folder).not.toContain('lab-website');
    const pdf = byName('publications').fields.find((f) => f.name === 'pdf') as any;
    expect(pdf.public_folder).not.toContain('lab-website');
  });

  // {{year}} and {{month}} resolve from the creation time, not the entry's fields.
  it('builds slugs from entry fields rather than the creation date', () => {
    for (const collection of collections) {
      const slug = String((collection as any).slug ?? '');
      expect(slug, `${collection.name} slug uses a creation-time date tag`).not.toMatch(
        /\{\{(year|month|day|hour|minute|second)\}\}/,
      );
    }
  });
});

describe('fields match the content schema', () => {
  // Required in the Zod schema means required in the form, or the build breaks.
  it.each([
    ['news', ['title', 'date', 'body']],
    ['people', ['name', 'role', 'body']],
    ['projects', ['title', 'summary', 'body']],
    ['publications', ['title', 'authors', 'venue', 'year']],
  ])('%s exposes its required fields', (collection, required) => {
    for (const field of required) {
      expect(fieldNames(collection), `${collection} is missing ${field}`).toContain(field);
    }
  });

  it('offers exactly the roles the schema accepts', () => {
    // Read the ROLES array itself rather than a list of names, so a role added
    // to the schema and not to the CMS actually fails here.
    const block = /const ROLES = \[([\s\S]*?)\] as const;/.exec(schema);
    expect(block, 'could not find the ROLES array in the schema').not.toBeNull();
    const schemaRoles = [...block![1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(schemaRoles.length).toBeGreaterThan(1);

    const role = byName('people').fields.find((f) => f.name === 'role') as any;
    const offered = role.options.map((o: { value: string }) => o.value);
    expect(offered.sort()).toEqual(schemaRoles.sort());
  });

  it('offers exactly the publication types the schema accepts', () => {
    const match = /\.enum\(\[\s*'journal'[^\]]*\]\)/.exec(schema);
    expect(match).not.toBeNull();
    const schemaTypes = [...match![0].matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
    const type = byName('publications').fields.find((f) => f.name === 'type') as any;
    const offered = type.options.map((o: { value: string }) => o.value);
    expect(offered.sort()).toEqual(schemaTypes.sort());
  });

  it('offers exactly the project statuses the schema accepts', () => {
    const match = /status:\s*z\s*\n?\s*\.enum\(\[([^\]]*)\]\)/.exec(schema);
    expect(match, 'could not find the status enum in the schema').not.toBeNull();
    const schemaStatuses = [...match![1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(schemaStatuses.length).toBeGreaterThan(1);

    const status = byName('projects').fields.find((f) => f.name === 'status') as any;
    expect(status.options.map((o: { value: string }) => o.value).sort()).toEqual(
      schemaStatuses.sort(),
    );
  });

  it('stores images beside their entries, as the schema resolves them', () => {
    for (const name of ['news', 'people', 'projects']) {
      const collection = byName(name) as any;
      expect(collection.media_folder, `${name} media_folder must be relative`).not.toMatch(
        /^\//,
      );
      expect(collection.public_folder, `${name} public_folder must be relative`).toMatch(
        /^\.\//,
      );
    }
  });

  it('links a publication to a research area by slug', () => {
    const project = byName('publications').fields.find((f) => f.name === 'project') as any;
    expect(project.widget).toBe('relation');
    expect(project.collection).toBe('projects');
    expect(project.value_field).toBe('{{slug}}');
  });

  it('writes dates in utc so the day cannot shift', () => {
    const date = byName('news').fields.find((f) => f.name === 'date') as any;
    expect(date.picker_utc).toBe(true);
    expect(date.time_format).toBe(false);
  });
});

describe('no schema field is missing from the CMS', () => {
  /** Field names declared inside one `z.object({ ... })` block of the schema. */
  function schemaFields(collectionName: string): string[] {
    const start = schema.indexOf(`const ${collectionName} = defineCollection(`);
    expect(start, `${collectionName} not found in the schema`).toBeGreaterThan(-1);
    // Skip past this collection's own defineCollection before looking for the
    // next one, or the block ends before any field is reached.
    const own = schema.indexOf('defineCollection(', start);
    const next = schema.indexOf('defineCollection(', own + 1);
    const block = schema.slice(own, next === -1 ? undefined : next);
    // Top-level fields sit at four spaces (`schema: z.object({`) or six
    // (`schema: ({ image }) => z.object({`). Anything deeper is a nested field,
    // which the CMS nests too, so it is covered by its parent.
    return [...block.matchAll(/^ {4,6}(\w+):/gm)].map((m) => m[1]);
  }

  // A field the CMS does not declare is silently stripped the next time an
  // entry is saved there, which is data loss with no error.
  it.each(['news', 'people', 'projects', 'publications'])(
    '%s declares every field its schema defines',
    (name) => {
      const declared = schemaFields(name);
      expect(declared.length).toBeGreaterThan(2);
      for (const field of declared) {
        expect(fieldNames(name), `${name}.${field} is missing from the CMS`).toContain(
          field,
        );
      }
    },
  );
});
