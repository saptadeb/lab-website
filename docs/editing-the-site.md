# Editing the site through the admin page

There are two ways to update this site. This page covers the easier one.

**Admin page:** <https://saptadeb.github.io/lab-website/admin-page/>

It is not linked from anywhere on the site. You need the address, a shared passphrase, and
a GitHub account with write access to the repository.

## What you can do there

Create, edit, and delete entries in any of four sections, through forms:

| Section | What it holds |
| --- | --- |
| News | Announcements, papers, talks, awards |
| People | Everyone in the lab, past and present |
| Research areas | The focus topics on the Research page |
| Publications | Papers, preprints, patents, theses |

Saving writes an ordinary commit to the repository, exactly as if you had edited the file
by hand. About a minute later the live site updates.

## Signing in

**Step 1: the passphrase.** A username and passphrase gate the page. Ask whoever set the
site up. This only hides the page; it is not the real security (see below).

**Step 2: GitHub.** Click **Sign In with Token**. The screen links to GitHub's token page
with the right permissions preselected. Create the token, paste it in, and you are in. The
token stays in your browser and is not shared with anyone.

The permissions the token needs are **Contents: read and write**. Nothing else.

### Making step 2 nicer, later

Pasting a token is fine for one or two technical people but is a poor experience for
everyone else. The alternative is a normal "Sign in with GitHub" button, which needs a
small free piece of infrastructure:

1. Deploy [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) to Cloudflare
   Workers. Free, and it is a fork-and-deploy, not a build.
2. Register a GitHub OAuth App, with the Worker URL plus `/callback` as the redirect.
3. Put the client id and secret into the Worker's environment variables.
4. Uncomment `base_url` in `public/admin-page/config.yml` and point it at the Worker.

Worth doing before handing the site to someone non-technical.

## About the passphrase

**It is a doormat, not a lock.** The repository is public, so the passphrase hash sits in
the page source where anyone can read it. It keeps out someone who stumbles across the
address. It would not stop anyone who is actually trying.

That is acceptable because **the passphrase is not what protects your content.** The real
boundary is GitHub: nothing on that page can read or change anything until you sign in with
an account that has write access to the repository. Someone past the passphrase and without
a GitHub token can do precisely nothing.

To change it, generate a new hash and paste it into `GATE_HASH` in
`public/admin-page/index.html`:

```bash
node -e "console.log(require('node:crypto').createHash('sha256').update('USERNAME:PASSPHRASE').digest('hex'))"
```

The current credentials are `root` / `admin`.

### If you want real authentication

One option, and it becomes available as soon as the custom domain is live on Cloudflare:
**Cloudflare Access**. It is free for up to 50 users, sits in front of `/admin-page/`, and
authenticates people by emailing them a one-time code before the page loads at all. That is
genuine access control rather than obscurity. It requires the site to be served through
Cloudflare, which it will be once the domain is registered there.

The other options, for completeness:

- **Make the repository private.** Pages then needs a paid GitHub plan.
- **Move hosting to Cloudflare Pages or Netlify.** Both are free and both support real
  password protection on a path, unlike GitHub Pages.

## Things it cannot do

- **Rename an entry's web address.** You can change a title freely, but the address is
  fixed when the entry is created. To change it, delete the entry and make a new one, or
  rename the file on GitHub directly.
- **Preview before saving.** There is no live preview. Save, wait a minute, look at the
  site. A mistake is never fatal: see below.
- **Edit the fixed pages.** The About page, the Join Us page, the lab name, and the contact
  details are not in the CMS. They change rarely and live in files;
  [CONTENT.md](../CONTENT.md) says where.
- **Break the live site.** If an edit produces content the site cannot build, the build
  fails and the previous version stays up. You will get an email about it. Nothing the CMS
  can write will take the site down.

## When something goes wrong

The repository's **Actions** tab shows every publish attempt. A red mark means the last
edit did not go live, and the log names the file and the reason. The usual causes are a
required field left empty or an image that did not finish uploading.

Editing the files by hand always remains available and is documented in
[CONTENT.md](../CONTENT.md).
