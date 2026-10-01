# Lab website

Static site for the lab, built with [Astro](https://astro.build) and
[Tailwind CSS](https://tailwindcss.com). No CMS, no server, no database. Content lives in
Markdown and YAML files in this repository, and every push to `main` republishes the site.

## Local development

Requires Node 22 LTS.

```bash
npm install
npm run dev         # http://localhost:4321/lab-website
npm run build       # production build into dist/
npm run preview     # serve the production build locally
npm run check       # type-check templates and content schemas
npm run test        # unit tests
npm run test:watch  # unit tests, re-running on change
npm run verify      # check + test, the same gate CI applies
```

## Tests

`npm run test` runs Vitest over the pure logic in `src/lib/` and over the content files
themselves. The content tests are the ones that matter day to day: they catch a duplicate
publication id, a `project:` pointing at a research area that does not exist, a doi stored
as a full url, an unknown role on a person, a filename that would produce a broken page
address, and an unparseable date. Those are the mistakes hand-editing YAML invites, and
Astro's own schemas cannot express them.

CI runs `check` and `test` before it builds, and will not publish if either fails.

## Where things live

| Path | What it is |
| --- | --- |
| `src/config/site.ts` | Lab name, contacts, socials, analytics, page on/off flags, nav |
| `src/content.config.ts` | Schemas for people, projects, news, publications |
| `src/content/people/` | One Markdown file per person |
| `src/content/projects/` | One Markdown file per research area |
| `src/content/news/` | One Markdown file per news post |
| `src/content/publications/` | One Markdown file per publication |
| `src/styles/global.css` | Design tokens (colors, type) and long-form text styles |
| `docs/free-services.md` | Free-tier limits and caveats for every outside service |
| `src/pages/` | One file per route |
| `src/lib/` | Pure helpers, with unit tests beside them in `__tests__/` |
| `tests/` | Content integrity tests over the Markdown and YAML files |
| `public/` | Files served as-is: favicon, robots.txt, PDFs, images |

**Adding content is documented for non-developers in [CONTENT.md](./CONTENT.md).**

## Pages currently built (Tier A)

Home, About, Research (+ per-area pages), Publications, People (+ per-person pages), News
(+ per-post pages), Join Us, Contact, 404, RSS feed, sitemap.

Additional sections (alumni page, datasets, software, protocols, funding, events, teaching,
gallery, facilities, location, FAQ, privacy, and so on) are pre-declared as flags in
`PAGES` in `src/config/site.ts`. Flipping a flag to `true` shows it in the nav; the page
itself gets built when that section is confirmed.

## Deployment

`.github/workflows/deploy.yml` builds on every push to `main` and publishes to GitHub Pages.

One-time setup in the GitHub repo:

1. **Settings → Pages → Source: GitHub Actions.**
2. When a custom domain is ready: add it under Settings → Pages, then set repository
   variables **`SITE_URL`** (e.g. `https://arabilab.com`) and **`BASE_PATH`** (`/`) under
   Settings → Secrets and variables → Actions → Variables. The build reads both.

## Outstanding TODOs

- [ ] Replace all `Placeholder` text and the sample content files with real content.
- [ ] Add `public/og-default.png` (1200×630), the default social share image.
- [ ] Replace `public/favicon.svg` with the lab's mark.
- [ ] Set `analytics.id` in `src/config/site.ts` to switch analytics on. Nothing is
      loaded while it is empty, so the site currently ships with no tracking.
- [ ] Set `form.key` in `src/config/site.ts` to switch the contact form on. Until then
      the page shows a mailto link.
- [ ] Set the real coordinates in `contact.map`.

## Editing the site without touching code

The lab expects to update the site about once a month, and the person doing it is not a
developer. The plan for that, in the order it is being built:

| # | Step | Status |
| --- | --- | --- |
| 1 | **Admin page at [`/admin-page`](https://saptadeb.github.io/lab-website/admin-page/)** for creating, editing, and deleting research areas, people, news posts, and publications through forms. Served from this repo but not linked anywhere on the site, and behind a shared passphrase. Writes ordinary Markdown commits, so content stays in the repo and the CMS can be removed at any time without touching it. See [docs/editing-the-site.md](./docs/editing-the-site.md). | **done** |
| 2 | **Email when a build fails.** A bad edit never breaks the live site, it just does not publish, so the editor needs to be told. | planned |
| 3 | **Publications pulled from Zotero or ORCID.** Publications change most often and are the most tedious to type. Adding a paper to a reference manager should be enough to put it on the site. | planned |
| 4 | **A short recorded walkthrough** for whoever inherits the site. | planned |

Notes on what was ruled out, and why:

- **A hosted CMS such as Pages CMS** was the earlier recommendation, but it lives at the
  vendor's own domain rather than as a page on this site. The requirement was a link inside
  this site's own structure, which needs a client-side CMS served from `public/`.
- **A headless CMS** (Sanity, Contentful, Notion) would move the content out of this
  repository into a vendor account, which conflicts with the lab owning everything
  outright. Ruled out.
- **GitHub issue forms** were going to be the cheap version of step 1. The admin page
  does the same job better, so they were dropped rather than built alongside.

Hand-editing the files directly stays fully supported, and is documented for
non-developers in [CONTENT.md](./CONTENT.md).

## Third-party services

Analytics, the contact form, the map, fonts, hosting, and the domain all run on free
tiers. **[docs/free-services.md](./docs/free-services.md)** lists what each one allows,
what it costs if the lab outgrows it, and the privacy trade-offs that come with each.
