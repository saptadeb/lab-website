/**
 * The shape of every editing form. This mirrors src/content.config.ts, which is
 * the real schema; tests/admin-fields.test.ts fails if a field exists there and
 * not here, because a field the form does not know about is dropped the next time
 * someone saves an entry.
 */

const LINK_FIELDS = [
  ['website', 'Website'],
  ['scholar', 'Google Scholar'],
  ['github', 'GitHub'],
  ['linkedin', 'LinkedIn'],
  ['x', 'X'],
  ['orcid', 'ORCID'],
];

export const ROLES = [
  ['pi', 'Principal Investigator'],
  ['postdoc', 'Postdoctoral Researcher'],
  ['grad', 'Graduate Student'],
  ['undergrad', 'Undergraduate Researcher'],
  ['staff', 'Staff'],
  ['alum', 'Alum'],
  ['collaborator', 'Collaborator'],
];

export const PUBLICATION_TYPES = [
  ['journal', 'Journal article'],
  ['conference', 'Conference paper'],
  ['workshop', 'Workshop paper'],
  ['preprint', 'Preprint'],
  ['thesis', 'Thesis'],
  ['patent', 'Patent'],
];

export const COLLECTIONS = [
  {
    name: 'news',
    label: 'News',
    singular: 'News post',
    slugFrom: 'title',
    listFields: ['date', 'title'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      {
        name: 'summary',
        label: 'Summary',
        type: 'textarea',
        hint: 'One sentence. Shows on the news list and in the feed.',
      },
      { name: 'image', label: 'Image', type: 'image' },
      {
        name: 'imageAlt',
        label: 'Image description',
        type: 'text',
        hint: 'Describe the image for someone using a screen reader.',
      },
      { name: 'tags', label: 'Tags', type: 'list' },
      { name: 'draft', label: 'Hide from the site', type: 'boolean' },
      { name: 'body', label: 'Post', type: 'markdown', required: true },
    ],
  },
  {
    name: 'people',
    label: 'People',
    singular: 'Person',
    slugFrom: 'name',
    listFields: ['name', 'role'],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'role', label: 'Role', type: 'select', options: ROLES, required: true },
      {
        name: 'title',
        label: 'Job title',
        type: 'text',
        hint: 'Shown under the name, for example "PhD Student".',
      },
      { name: 'photo', label: 'Photo', type: 'image' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'blurb', label: 'One-line blurb', type: 'textarea' },
      {
        name: 'links',
        label: 'Links',
        type: 'object',
        fields: LINK_FIELDS.map(([name, label]) => ({ name, label, type: 'url' })),
      },
      { name: 'interests', label: 'Research interests', type: 'list' },
      { name: 'yearsInLab', label: 'Years in the lab', type: 'text', hint: 'Alumni only.' },
      { name: 'currentAffiliation', label: 'Current affiliation', type: 'text', hint: 'Alumni only.' },
      {
        name: 'order',
        label: 'Sort order',
        type: 'number',
        hint: 'Lower numbers appear first within a group.',
      },
      { name: 'draft', label: 'Hide from the site', type: 'boolean' },
      { name: 'body', label: 'Bio', type: 'markdown', required: true },
    ],
  },
  {
    name: 'projects',
    label: 'Research areas',
    singular: 'Research area',
    slugFrom: 'title',
    listFields: ['order', 'title'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      {
        name: 'summary',
        label: 'Summary',
        type: 'textarea',
        required: true,
        hint: 'One sentence for the card on the Research page.',
      },
      { name: 'thumbnail', label: 'Thumbnail', type: 'image' },
      { name: 'order', label: 'Sort order', type: 'number' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: [
          ['active', 'Active'],
          ['completed', 'Completed'],
        ],
      },
      {
        name: 'topics',
        label: 'Topics',
        type: 'list',
        hint: 'Publications sharing a topic appear on this page automatically.',
      },
      { name: 'featured', label: 'Show on the home page', type: 'boolean' },
      { name: 'draft', label: 'Hide from the site', type: 'boolean' },
      { name: 'body', label: 'Description', type: 'markdown', required: true },
    ],
  },
  {
    name: 'publications',
    label: 'Publications',
    singular: 'Publication',
    slugFrom: 'title',
    slugPrefix: 'year',
    listFields: ['year', 'title'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      {
        name: 'authors',
        label: 'Authors',
        type: 'list',
        required: true,
        hint: 'In order. Wrap lab members in double asterisks, like **Jane Doe**.',
      },
      {
        name: 'venue',
        label: 'Venue',
        type: 'text',
        required: true,
        hint: 'Journal or conference, with volume and pages if you have them.',
      },
      { name: 'year', label: 'Year', type: 'number', required: true },
      { name: 'type', label: 'Type', type: 'select', options: PUBLICATION_TYPES },
      {
        name: 'doi',
        label: 'DOI',
        type: 'text',
        hint: 'Just the identifier starting with 10. Not the full doi.org link.',
        pattern: '^10\\..+',
      },
      { name: 'url', label: 'Link', type: 'url' },
      { name: 'pdf', label: 'PDF path', type: 'text', hint: 'For example /pdfs/paper.pdf' },
      { name: 'code', label: 'Code repository', type: 'url' },
      { name: 'topics', label: 'Topics', type: 'list' },
      { name: 'featured', label: 'Show on the home page', type: 'boolean' },
      { name: 'project', label: 'Related research area', type: 'relation', collection: 'projects' },
      { name: 'bibtex', label: 'BibTeX', type: 'textarea' },
      { name: 'note', label: 'Note', type: 'text', hint: 'Shown after the venue, like "Under review".' },
    ],
  },
];

export const byName = (name) => COLLECTIONS.find((c) => c.name === name);

/** Turns a title into a filename that is safe as a page address. */
export function slugify(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Builds the filename for a new entry, including any configured prefix. */
export function buildSlug(collection, values) {
  const base = slugify(values[collection.slugFrom]);
  if (!collection.slugPrefix) return base;
  const prefix = slugify(values[collection.slugPrefix]);
  return prefix ? `${prefix}-${base}` : base;
}
