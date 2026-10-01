# Project plan and status

Living record of what this site is, what has been built, what is next, and why the main
decisions went the way they did. Updated as work lands.

**Last updated:** 30 September 2026

## The site

Website for the Aarabi Lab, UCSF East Bay Surgery Program. PI: Shahram Aarabi, MD, MPH.

Static Astro site, content in Markdown in this repository, deployed to GitHub Pages on
every push to `main`. Live at <https://saptadeb.github.io/lab-website/> until a custom
domain is registered.

## Status at a glance

| Phase | State |
| --- | --- |
| Foundation: Astro, Tailwind, design tokens, deploy pipeline | done |
| Tier A pages | done |
| Content model and schemas | done |
| Free third-party services wired up | done |
| Unit tests and CI gate | done |
| Admin page for non-developer editing | done, needs the Worker deployed |
| Notification when a build fails | done |
| Publications pulled from ORCID or Zotero | next |
| Recorded walkthrough for handoff | planned |
| Real content throughout | blocked on the PI |
| Domain, polish, accessibility pass, handoff | planned |

## What exists

**Pages.** Home, About, Research plus a page per research area, Publications, People plus a
page per person, News plus a page per post, Join Us, Contact, a custom 404, an RSS feed, and
a sitemap. Nineteen pages build in about one second.

**Content model.** Four collections, each schema-validated at build time so a bad edit fails
the build rather than publishing: `people`, `projects` (research areas), `news`, and
`publications`. Cross-linking is automatic: a publication tagged with a research area's
topic appears on that area's page, and on the bio page of any author whose surname matches.

**Features.** Publication search and filtering by type and topic, year grouping, lab members
bolded in author lists. Responsive navigation. SEO and Open Graph metadata. Contact form
wired to a free relay. Keyless OpenStreetMap embed with directions links. Analytics behind
one config value, loading nothing until it is set.

**Tests.** 89 tests. Pure logic in `src/lib/`, plus content integrity tests that catch the
mistakes hand-editing invites: dangling research area references, a DOI stored as a URL,
unbalanced author asterisks, unknown roles, filenames that would break a page address,
unparseable dates. A further suite pins the admin page's config to the content schema, since
those two files duplicate each other and drift would be invisible until a build broke.

**CI.** Three stages: `verify` (type check plus tests), then `build`, then `deploy`. A
failing test blocks publication. Pull requests are verified and built but never published.

**Editing without code.** Passphrase-gated admin page at `/admin-page`, not linked from the
site, with create, edit, and delete forms over all four collections. See
[editing-the-site.md](./editing-the-site.md).

## Next, in order

**1. Publications from ORCID or Zotero.** Publications change most often and are the most
tedious to enter by hand. The PI has an ORCID record (0000-0002-9514-9873), so a scheduled
job can pull from it and open a pull request. This removes the highest-friction editing task
entirely.

**2. Recorded walkthrough.** Ten minutes, screen-recorded, for whoever inherits the site.

**3. Polish before handoff.** Social share image, real favicon, Lighthouse and accessibility
passes, a check at 320px width, then the domain.

## Decisions, and why

**Astro rather than Next.js, Nuxt, or SvelteKit.** The site is mostly static content pages
with a few interactive pieces. Astro ships zero JavaScript by default and allows an island
only where one is needed. A meta-framework would add a runtime to every page for no gain,
and there is no backend in scope.

**Content in the repository, not a hosted CMS.** The worksheet gives the lab full ownership
of everything at handoff. A headless CMS would move the content into a vendor account and
undercut that. Markdown in git is portable, diffable, and survives any tool choice.

**One file per publication, not one combined list.** A single YAML file is tidier to
generate from BibTeX, but a form over a hundred-entry list is poor to use and risks
rewriting every entry on one bad save. Per-entry files give clean create and delete, readable
diffs, and make the ORCID import straightforward.

**Custom forms behind a Cloudflare Worker, not an off-the-shelf CMS.** Sveltia CMS came
first, and it worked, but every git-based CMS makes the editor authenticate with GitHub
because the browser is the thing doing the committing. Pasting a token is poor for a
non-developer, and no password compared in page JavaScript is real security on a public
repository.

Moving the credential into a Worker fixes both. The page holds nothing secret, the password
is checked server-side, and signing in leads straight to the forms. The cost is one free
Worker to deploy and a set of forms to maintain rather than inherit.

**Astro 7, not the 5.x originally pinned.** The first pin carried ten security advisories,
one critical, including an XSS in the `define:vars` directive that the analytics component
uses. Upgrading cleared all of them.

**Failure notification through a GitHub issue, not only email.** Opening an issue needs no
secret, works the moment it is pushed, and leaves a visible record that closes itself. Direct
SMTP mail is wired up behind a secret for the case where the editor is not the repository
owner, since issue notifications follow watchers rather than a chosen address.

**Section visibility behind flags.** Every section from the worksheet, including the ones not
yet built, exists as a flag in `PAGES` in `src/config/site.ts`. Turning one on is a one-word
edit; the navigation follows automatically.

## Open questions

- **Lab name.** "Aarabi Lab" is an assumption. Confirm with the PI.
- **Contact email.** No public address is listed on the UCSF pages, so the config has an
  empty value and the contact page falls back accordingly. Needs the PI's preference.
- **Physical address and map coordinates.** Still placeholder. Highland Hospital in Oakland
  is the likely location, but it should be confirmed rather than guessed.
- **Which Tier B sections are wanted.** Section 1 of the worksheet was returned blank, so
  Tier A was built on inference. Alumni, datasets, software, protocols, funding, events,
  teaching, gallery, facilities, location, and FAQ are all one flag plus one page away.
- **Analytics provider.** GoatCounter is configured but has no site code yet. The choice
  decides whether a privacy statement is needed.
- **Self-hosting fonts.** Google Fonts sends every visitor's IP to Google, which some
  institutions treat as requiring consent. Self-hosting is free and faster.

## Milestones from the scope worksheet

| Milestone | Target |
| --- | --- |
| First draft checkpoint | End of October |
| Major revision round | After first draft feedback |
| Iterative revision sprints | 14-day cycles from end of November |
| Final delivery and handoff | 1 December |

The build is ahead of this schedule. Content is the critical path, and it sits with the PI:
lab name, bios and photos for the team, research area descriptions, a publication list, and
the contact details above.

## Related documents

- [CONTENT.md](../CONTENT.md), editing the files by hand, written for non-developers
- [editing-the-site.md](./editing-the-site.md), the admin page and its security limits
- [free-services.md](./free-services.md), every free tier in use and its caveats
