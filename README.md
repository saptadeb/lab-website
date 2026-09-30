# Lab website

Static site for the lab, built with [Astro](https://astro.build) and
[Tailwind CSS](https://tailwindcss.com). No CMS, no server, no database — content lives in
Markdown and YAML files in this repository, and every push to `main` republishes the site.

## Local development

Requires Node 22 LTS.

```bash
npm install
npm run dev      # http://localhost:4321/lab-website
npm run build    # production build into dist/
npm run preview  # serve the production build locally
npm run check    # type-check templates and content schemas
```

## Where things live

| Path | What it is |
| --- | --- |
| `src/config/site.ts` | Lab name, contacts, socials, analytics, page on/off flags, nav |
| `src/content.config.ts` | Schemas for people, projects, news, publications |
| `src/content/people/` | One Markdown file per person |
| `src/content/projects/` | One Markdown file per research area |
| `src/content/news/` | One Markdown file per news post |
| `src/data/publications.yaml` | All publications, in one file |
| `src/styles/global.css` | Design tokens (colors, type) and long-form text styles |
| `src/pages/` | One file per route |
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
- [ ] Add `public/og-default.png` (1200×630) — the default social share image.
- [ ] Replace `public/favicon.svg` with the lab's mark.
- [ ] Set `analytics.provider` in `src/config/site.ts` (and add a privacy statement if the
      choice involves cookies).
- [ ] Set `formEndpoint` in `src/config/site.ts` to enable the contact form.
- [ ] Set the real coordinates in `contact.map`.
