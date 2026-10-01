# Knowing when the site fails to publish

A bad edit cannot break the live site. The build fails, the previous version stays up, and
the site simply stops reflecting new changes. That is a safe failure, but a silent one, so
the workflow reports itself.

## What happens on a failure

Two things, in this order.

**1. A GitHub issue opens.** Titled "The site failed to publish", labelled `build-failure`,
with the commit, who saved it, and a link to the failed run. This needs no setup and works
already. GitHub emails everyone watching the repository when an issue opens, which is how
the message reaches an inbox without any mail configuration.

If a failure happens while an issue is already open, the run comments on it rather than
opening a second one. When a build succeeds again, the issue is commented on and closed
automatically, so **an open `build-failure` issue always means the live site is behind the
repository.**

**2. An email, if SMTP is configured.** Off by default, because it needs a secret. See
below.

Failures on pull requests are not reported. They are already visible on the pull request
itself, and reporting them would be noise.

## Making sure the issue email actually arrives

GitHub only emails you about issues in repositories you watch, and it uses the address on
your GitHub account.

1. Open the repository and set **Watch** to *All Activity*, or at least make sure Issues
   are included in a custom watch.
2. Check <https://github.com/settings/emails> that the right address is listed and verified.
3. Check <https://github.com/settings/notifications> that email is enabled for Issues.

While you are there, it is worth also enabling **Actions → Send notifications for failed
workflows only** on that same page. That is a separate, built-in GitHub mechanism and it
gives you a second safety net at no cost.

## Adding direct email

Worth doing when the person who edits the site is not the person who owns the repository,
since issue notifications follow the repository watchers rather than an address you choose.

The recipient defaults to `saptadeep.deb@gmail.com` and is overridable without touching the
workflow.

**Repository variables** (Settings → Secrets and variables → Actions → Variables):

| Variable | Purpose | Default |
| --- | --- | --- |
| `NOTIFY_EMAIL` | Where failure mail goes | `saptadeep.deb@gmail.com` |
| `SMTP_SERVER` | Mail server | `smtp.gmail.com` |
| `SMTP_PORT` | Port | `465` |

**Repository secrets** (same page, Secrets tab):

| Secret | Purpose |
| --- | --- |
| `SMTP_USERNAME` | The sending account's address |
| `SMTP_PASSWORD` | An app password, never the account password |

The mail step is skipped entirely while `SMTP_PASSWORD` is unset, so adding the secret is
what switches it on.

### Getting a Gmail app password

Gmail will not accept an account password from a script. You need an app password, which
requires two-factor authentication on the account first.

1. Turn on 2-Step Verification at <https://myaccount.google.com/security>.
2. Go to <https://myaccount.google.com/apppasswords> and create one. Name it something
   recognisable, such as "lab website CI".
3. Paste the sixteen characters into the `SMTP_PASSWORD` secret, with no spaces.
4. Put the same account's address into `SMTP_USERNAME`.

An app password grants access to send mail as that account. It belongs in a repository
secret and nowhere else. It can be revoked from that same page at any time.

### Other providers

Any SMTP service works by setting the three variables. Resend, Mailgun, and Brevo all have
free tiers and avoid pointing CI at a personal mailbox, which is the tidier arrangement once
the site belongs to the lab rather than to you.

## Testing it

Push a commit that deliberately breaks the content, for example a publication whose `year`
is text rather than a number. The build should fail, an issue should open within a minute or
two, and the live site should remain exactly as it was. Then revert, and watch the issue
close itself.
