import { defineCollection, reference, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

/**
 * Content model. Every schema is validated at build time, so a typo in a
 * content file fails the build with a clear message instead of shipping.
 */

const ROLES = [
  'pi',
  'postdoc',
  'grad',
  'undergrad',
  'staff',
  'alum',
  'collaborator',
] as const;

/** Prose pages for each research area. */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      thumbnail: image().optional(),
      /** Lower numbers sort first on the research page. */
      order: z.number().default(99),
      status: z.enum(['active', 'completed']).default('active'),
      /** Free-form topic tags, shared with publications for cross-linking. */
      topics: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

const people = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/people' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.enum(ROLES),
      /** e.g. "Graduate Student", "Research Scientist" — shown under the name. */
      title: z.string().optional(),
      photo: image().optional(),
      email: z.string().email().optional(),
      /** One-line blurb for the grid card; the body is the full bio. */
      blurb: z.string().optional(),
      links: z
        .object({
          website: z.string().url().optional(),
          scholar: z.string().url().optional(),
          github: z.string().url().optional(),
          linkedin: z.string().url().optional(),
          x: z.string().url().optional(),
          orcid: z.string().url().optional(),
        })
        .default({}),
      interests: z.array(z.string()).default([]),
      /** Alumni only. */
      yearsInLab: z.string().optional(),
      currentAffiliation: z.string().optional(),
      order: z.number().default(99),
      draft: z.boolean().default(false),
    }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/news' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      /** Optional short summary; falls back to the first paragraph. */
      summary: z.string().optional(),
      image: image().optional(),
      imageAlt: z.string().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
    }),
});

/**
 * Publications live in one YAML file rather than one file each — easier to
 * maintain by hand and easy to generate from a BibTeX or Scholar export.
 */
const publications = defineCollection({
  loader: file('./src/data/publications.yaml'),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    /** Author strings; mark lab members with ** around the name. */
    authors: z.array(z.string()),
    venue: z.string(),
    year: z.number(),
    type: z
      .enum(['journal', 'conference', 'preprint', 'thesis', 'patent', 'workshop'])
      .default('journal'),
    doi: z.string().optional(),
    url: z.string().url().optional(),
    pdf: z.string().optional(),
    code: z.string().url().optional(),
    bibtex: z.string().optional(),
    topics: z.array(z.string()).default([]),
    /** Pin to the top of the publications page and show on the home page. */
    featured: z.boolean().default(false),
    /** Optional link back to a research area page. */
    project: reference('projects').optional(),
    note: z.string().optional(),
  }),
});

export const collections = { projects, people, news, publications };
