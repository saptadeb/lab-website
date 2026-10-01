# Editing the site through the admin page

**Admin page:** <https://saptadeb.github.io/lab-website/admin-page/>

Sign in with a username and password, and you land straight on the editing forms. There is
no GitHub step and nothing to paste.

It is not linked from anywhere on the site, so you need the address.

## What you can do

Create, edit, and delete entries in four sections:

| Section | What it holds |
| --- | --- |
| News | Announcements, papers, talks, awards |
| People | Everyone in the lab, past and present |
| Research areas | The focus topics on the Research page |
| Publications | Papers, preprints, patents, theses |

You can also upload photos and images directly in the form. Saving commits to the
repository, and the site republishes within about a minute.

## How it is secured

This is a static site, so the page itself cannot hold a credential: anything shipped to the
browser is readable by anyone, and the repository is public.

Instead there is a small **Cloudflare Worker** sitting between the page and GitHub.

```
  Browser                    Worker                      GitHub
  -------                    ------                      ------
  password  ------------->   checks it against a
                             hash it alone holds
            <-------------   signed session token
                             (expires after 8 hours)

  save entry + token ---->   verifies the signature
                             then commits using its
                             own GitHub token      --->  commit
```

What this buys:

- **The GitHub token never reaches the browser.** Only the Worker has it.
- **The password is checked somewhere nobody can read it.** Unlike a password compared in
  page JavaScript, this is real access control rather than obscurity.
- **The session expires** after eight hours, and lives only in that browser tab.
- **The Worker only accepts requests from this site's origin**, and will only write to the
  four content folders. A request naming any other path is refused.

Hosting the Worker is free. Cloudflare's free tier allows 100,000 requests a day, and
editing a lab website uses a handful.

## One-time setup

### 1. Create a GitHub token for the Worker

A **fine-grained** token, scoped to this repository only:

1. Go to <https://github.com/settings/personal-access-tokens/new>.
2. Resource owner: your account. Repository access: **Only select repositories**, and pick
   `lab-website`.
3. Permissions: **Contents → Read and write**. Nothing else.
4. Set an expiry. A year is reasonable; note the date, because the admin page stops being
   able to save when it lapses.
5. Copy the token. You will not see it again.

Scoping it to one repository matters: even in the worst case, this token cannot touch
anything else you own.

### 2. Deploy the Worker

```bash
cd worker
npm install
npx wrangler login          # opens a browser once
npx wrangler deploy
```

Wrangler prints a url like `https://lab-website-admin.<subdomain>.workers.dev`.

### 3. Give the Worker its secrets

```bash
npx wrangler secret put GITHUB_TOKEN          # paste the token from step 1
npx wrangler secret put SESSION_SECRET        # any long random string
npx wrangler secret put ADMIN_PASSWORD_HASH   # see below
```

For a random session secret: `openssl rand -hex 32`.

The password hash is the sha256 of `username:password`:

```bash
node -e "console.log(require('node:crypto').createHash('sha256').update('root:admin').digest('hex'))"
```

The current credentials are `root` / `admin`, whose hash is
`7edb9e78935ace77c356e45624e058b1ffb0c2e3ed7b445754b1c3806be38efb`. To change them, run the
command above with the new pair and set the secret again. **Nothing in this repository needs
editing to change the password**, which is the point: the hash lives only in the Worker.

`root`/`admin` is the first pair anyone would try. It is worth changing before the site is
on a public domain.

### 4. Point the page at the Worker

Put the url from step 2 into `public/admin-page/config.js`:

```js
export const API_BASE = 'https://lab-website-admin.<subdomain>.workers.dev';
```

Commit that. Until it is set, the login form says so rather than failing silently.

### 5. Check the origin allowlist

`worker/wrangler.toml` has `ALLOWED_ORIGIN`. It is set to
`https://saptadeb.github.io`. When the custom domain goes live, add it as a second
comma-separated value and redeploy, or the page will be refused.

## Things to know

- **Changing an entry's address.** The filename is set from the title when an entry is first
  created, and editing the title later does not move it. To change the address, delete the
  entry and create it again.
- **No preview.** Save, wait a minute, look at the site.
- **Two people editing at once.** If someone else changed an entry since you opened it,
  saving is refused with a message rather than overwriting their work. Reload and redo.
- **The fixed pages are not in here.** The About page, Join Us, the lab name, and the contact
  details live in files. [CONTENT.md](../CONTENT.md) says where.
- **Nothing here can break the live site.** If an edit produces content that will not build,
  the build fails, the previous version stays up, and you get an issue and an email. See
  [build-notifications.md](./build-notifications.md).

## If saving stops working

| Symptom | Likely cause |
| --- | --- |
| "This page is not connected to its Worker yet" | `API_BASE` is empty in `config.js` |
| "Those details are not right" | Wrong password, or `ADMIN_PASSWORD_HASH` does not match |
| "The Worker is missing GITHUB_TOKEN" | A secret was never set, or was set on a different Worker |
| Everything fails after months of working | The GitHub token expired. Make a new one and set the secret again |
| "Session expired" | Normal after eight hours. Sign in again |

Editing the files by hand always remains available, and is documented in
[CONTENT.md](../CONTENT.md).
