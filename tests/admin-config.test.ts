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

  it('keeps the editing interface out of search engines', () => {
    const page = readFileSync('public/admin-page/index.html', 'utf8');
    expect(page).toMatch(/name="robots"[^>]*noindex/);
    expect(readFileSync('public/robots.txt', 'utf8')).toContain('Disallow: /admin-page/');
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
    const schemaRoles = [
      ...schema.matchAll(/^\s*'(pi|postdoc|grad|undergrad|staff|alum|collaborator)',$/gm),
    ].map((m) => m[1]);
    const role = byName('people').fields.find((f) => f.name === 'role') as any;
    const offered = role.options.map((o: { value: string }) => o.value);
    expect(offered.sort()).toEqual([...new Set(schemaRoles)].sort());
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
    const status = byName('projects').fields.find((f) => f.name === 'status') as any;
    expect(status.options.map((o: { value: string }) => o.value).sort()).toEqual([
      'active',
      'completed',
    ]);
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
