# Updating the website

You don't need to know how to code to keep this site current.

**The easiest way: use the admin page.** It gives you forms for news posts, people,
research areas, and publications, with no files or syntax involved. See
[docs/editing-the-site.md](./docs/editing-the-site.md) for the address and how to sign in.

**The other way, documented below: edit the files directly.** Everything is a text file in
this repository. Open one on GitHub, click the pencil icon, make your change, and click
*Commit changes*. The live site updates within about a minute. This is worth knowing even
if you use the admin page, because it is how the fixed pages get edited.

Each file starts with a block between `---` lines. That's the structured part (title, date,
role). Everything below the second `---` is ordinary text, where `**bold**`, `*italic*`,
`## Heading`, and `- bullet` all work.

---

## Add a publication

Create a new file in **`src/content/publications/`**, e.g. `doe-2026-nature.md`. One file
per paper. The filename only has to be unique; `lastname-year-venue` is a good habit.

```markdown
---
title: The full title of the paper
authors:
  - '**Jane Doe**'
  - Outside Collaborator
  - '**Dr. Arabi**'
venue: 'Nature, 600(7889), 112-118'
year: 2026
type: journal        # journal | conference | workshop | preprint | thesis | patent
doi: 10.1038/s41586-026-00000-0
topics: ['topic-a']
featured: true       # also shows on the home page
---
```

Notes:

- Wrap **lab members** in `**double asterisks**` and they render in bold.
- Only `title`, `authors`, `venue`, and `year` are required.
- Quote any value containing a colon or an apostrophe, as with `venue` above.
- `doi` is just the identifier starting with `10.`, not the full `https://doi.org/` link.
- Optional extras: `url`, `pdf`, `code`, `note` (e.g. `Under review`), and
  `project: <research-area-filename>` to link it to a research area page.
- To attach a PDF: drop the file in `public/pdfs/` and set `pdf: /pdfs/yourfile.pdf`.
- Nothing goes below the closing `---`. Publications have no body text.

## Add a person

Create a new file in **`src/content/people/`**, e.g. `jane-doe.md`. The filename becomes the
page address (`/people/jane-doe`), so keep it lowercase with hyphens.

```markdown
---
name: Jane Doe
role: grad          # pi | postdoc | grad | undergrad | staff | alum | collaborator
title: PhD Student
email: jane@example.edu
photo: ./photos/jane-doe.jpg
blurb: Studies how placeholder things affect other placeholder things.
order: 20           # lower numbers appear first within their group
interests: ['Topic A', 'Topic B']
links:
  scholar: https://scholar.google.com/citations?user=XXXX
  github: https://github.com/janedoe
---

Jane's full bio goes here. A couple of paragraphs is plenty.
```

Photos: put the image in `src/content/people/photos/` and reference it as
`./photos/filename.jpg`. Roughly square or slightly tall works best; the site resizes and
crops automatically.

**When someone leaves:** change `role` to `alum` and add `yearsInLab: '2021–2026'` and
`currentAffiliation: Where They Are Now`.

## Add a news post

Create a file in **`src/content/news/`**, e.g. `2026-10-paper-accepted.md`. Starting the
filename with the date keeps the folder tidy.

```markdown
---
title: 'Our paper on placeholder things was accepted'
date: 2026-10-14
summary: One sentence that shows on the news list and in the RSS feed.
tags: ['publication']
---

The full post goes here.
```

Add an image with `image: ./images/photo.jpg` and `imageAlt: 'Short description'`.

## Add or edit a research area

Create a file in **`src/content/projects/`**, e.g. `protein-folding.md`. The filename becomes
the address (`/research/protein-folding`).

```markdown
---
title: Protein Folding at Scale
summary: One sentence for the card on the research page.
order: 1            # controls position on the research page
status: active      # active | completed
featured: true      # also shows on the home page
topics: ['topic-a', 'topic-b']
thumbnail: ./images/folding.jpg
---

The full description of this research area.
```

Publications that share a `topic` with a research area, or name it via `project:`, appear
automatically under "Related publications" on that page.

## Hide something without deleting it

Add `draft: true` to the block at the top of any person, news post, or research area file.
It disappears from the live site but stays in the repository. Remove the line to bring it
back.

## Edit the fixed pages

The pages whose text isn't in content files live in `src/pages/`:

| Page | File |
| --- | --- |
| Home page hero | `src/config/site.ts` (`name`, `tagline`) |
| About | `src/pages/about.astro` |
| Research intro paragraph | `src/pages/research/index.astro` |
| Join Us | `src/pages/join.astro` |
| Contact details, map | `src/config/site.ts` (`contact`) |
| Lab name, email, social links | `src/config/site.ts` |

In those files, only change the text between the HTML tags, and leave the tags themselves alone.

## If something breaks

A bad edit fails the build rather than publishing a broken site, so the live site keeps
working. Check the **Actions** tab on GitHub; the failed run names the file and line. The
usual causes are a missing quote around a title containing `:` or an apostrophe, or
inconsistent indentation in a list of authors or topics (always two spaces, never tabs).
