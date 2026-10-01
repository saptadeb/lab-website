# Free services this site depends on, and their catches

The site is built so the lab's recurring cost is one domain renewal, roughly
**$10 a year**. Everything else runs on a free tier. Free tiers come with limits and
trade-offs, and this page records them so nobody is surprised later.

**Limits below were accurate in September 2026.** Providers change them without much
notice, so re-check before relying on a number.

## At a glance

| Service | Used for | Free allowance | What happens if you exceed it |
| --- | --- | --- | --- |
| GitHub Pages | Hosting | 100 GB/month bandwidth, 1 GB site, 10 builds/hour | GitHub asks you to cut usage; sustained excess can mean suspension |
| GitHub Actions | Auto-deploy | Unlimited on public repos | n/a while the repo is public |
| GoatCounter | Analytics | No hard cap; sites above ~100k views/month should contact them | They ask you to pay or self-host |
| Web3Forms | Contact form | 250 submissions/month | Extra submissions are rejected until the month resets |
| OpenStreetMap | Map embed | Fair use | Heavy automated use gets rate-limited |
| Google Maps | Directions link only | Unlimited (plain link, no API) | n/a |
| Google Fonts | Inter, Newsreader | Unlimited | n/a |
| Cloudflare Registrar | Domain | At cost, no markup | n/a |

## Hosting: GitHub Pages

- **The repository must stay public.** Pages on a private repo requires a paid GitHub
  plan. Anyone can read the site's source, which is fine for a lab site but means no
  secrets, no unpublished manuscripts, and no personal data in the repo.
- **No server-side anything.** No databases, no logins, no server-sent email. This is why
  the contact form goes through a third party.
- **No control over HTTP headers.** You cannot set a Content-Security-Policy, custom
  caching rules, redirects, or password protection. If the lab ever needs any of those,
  Cloudflare Pages and Netlify are free too and do support them.
- **Soft limits, politely enforced.** The 100 GB/month bandwidth ceiling is far beyond
  what a lab site uses; a big video library in `public/` is the realistic way to approach
  it. Host video on YouTube or Vimeo and embed it instead.
- **Builds are public too.** Anyone can read the Actions logs.

## Analytics: GoatCounter

Set `analytics.provider` and `analytics.id` in `src/config/site.ts`. Nothing is loaded
while `id` is empty, so the site currently ships with **no tracking at all**.

- **Free for non-commercial use**, which covers an academic lab. Sites over roughly
  100,000 pageviews a month are asked to pay or self-host.
- **No cookies, no cross-site tracking, no personal data retained.** This is the reason to
  prefer it: under GDPR it does not require a consent banner, so the site needs no cookie
  popup. Confirm with your institution's policy before treating that as settled.
- **Small operation.** GoatCounter is maintained by one developer. It is open source and
  self-hostable, so the data isn't trapped, but the hosted service has no enterprise SLA.
- **Blocked for some visitors.** Ad blockers and Safari's protections drop analytics
  scripts, so counts understate real traffic. Every client-side analytics tool shares this
  problem; treat the numbers as trends, not a census.
- **Free accounts need the site code at signup**, and it becomes your subdomain:
  `https://<code>.goatcounter.com`.

### The alternatives, and why they weren't picked

- **Cloudflare Web Analytics** is also free and cookieless, and is supported in the config
  (`provider: 'cloudflare'`). It needs a Cloudflare account, and retains less history.
- **Plausible** is the nicest of the three and is supported in the config, but it has no
  free tier, only a trial. Around $9/month.
- **Google Analytics 4** is free and supported in the config, but it sets cookies, which
  means the site would need a privacy notice and, in the EU, likely a consent banner. It
  also samples data and is heavier to load. Pick it only if the institution requires it.

## Contact form: Web3Forms

Set `form.provider` and `form.key` in `src/config/site.ts`. While `key` is empty the page
shows a plain mailto link instead, which is a perfectly respectable fallback.

- **250 submissions a month.** Beyond that, submissions are rejected until the month
  rolls over. A lab contact form will not come close unless it gets spammed.
- **Messages pass through Web3Forms' servers** on the way to the lab inbox. Do not invite
  anyone to send confidential material through it. The form says so implicitly by keeping
  the lab's email address visible; prospective students with sensitive questions can mail
  directly.
- **Spam protection is a honeypot field only.** That stops naive bots. If real spam
  arrives, Web3Forms supports hCaptcha, which is a small change here.
- **Deliverability is out of your hands.** Forwarded mail can land in spam. Test it once
  after setup and whitelist the sender.
- **No attachments on the free plan**, and no stored archive of submissions: if the
  forwarded email is lost, the message is gone.
- **The form needs JavaScript for the in-page thank-you message.** Without it the browser
  posts normally and the visitor lands on Web3Forms' own confirmation page. It still
  works, it is just less tidy.

**Formspree** is the alternative, also supported (`provider: 'formspree'`), but its free
tier is 50 submissions a month rather than 250.

## Map: OpenStreetMap

- **No API key and no billing account**, which is exactly why it is here. An embedded
  Google map requires an API key tied to a credit card, with a monthly credit that is
  easy to blow past if a page gets popular.
- **Fair-use tiles.** The embed is fine for normal traffic. There is no SLA, and heavy
  automated use gets rate-limited.
- **Plainer cartography** than Google's, and no Street View or interior maps.
- **The embed is a third-party iframe**, so visitors' browsers contact
  openstreetmap.org. OSM does not advertise or track, but it is still an outbound request
  worth mentioning in a privacy statement.
- **Directions link out to both** OpenStreetMap and Google Maps. Those are plain
  keyless links, free and unlimited, and most visitors will want the Google one for
  turn-by-turn. Clicking it hands them to Google under Google's privacy policy.

## Fonts: Google Fonts

- The site loads Inter and Newsreader from `fonts.googleapis.com`. Free and unlimited,
  but **each visitor's browser contacts Google**, which sends their IP address. German
  courts have ruled that this needs consent under GDPR, so some European institutions
  require fonts to be self-hosted.
- **Self-hosting is free and makes the site faster** by removing two third-party
  connections. It is a small change: install the font packages and import them locally.
  Worth doing if the lab has EU visitors or a strict privacy office. Ask and it will be
  done.

## Domain: Cloudflare Registrar

- **Sold at wholesale cost with no markup**, typically $10–11/year for a `.com`, and no
  first-year discount that balloons on renewal.
- **The domain must use Cloudflare's DNS.** That is free and fast, but it is a condition.
- **ICANN forbids transferring a newly registered domain for 60 days.** Normal, but worth
  knowing.
- **Register it in the PI's or the lab's name, not the developer's.** Ownership should
  never need to be transferred later. Set the renewal to auto-renew and put the renewal
  date in a calendar: a lapsed domain is the one failure mode that takes the whole site
  down.
- Porkbun and Namecheap are fine alternatives at a dollar or two more.

## What would actually cost money later

Nothing here is a trap, but if the lab's needs grow, these are the thresholds:

| If the lab wants | It needs | Rough cost |
| --- | --- | --- |
| A private repository with Pages | GitHub Pro | $4/month |
| Nicer analytics with history | Plausible | $9/month |
| More than 250 form submissions a month | Web3Forms paid | from $8/month |
| Someone other than one person editing content | A CMS, or Decap/Sveltia CMS on top of this repo | free, plus setup time |
| Custom HTTP headers, redirects, or password protection | Cloudflare Pages or Netlify instead of GitHub Pages | free |
| Email at the lab's own domain | A mail provider | $6/user/month and up |

## Setup checklist

- [ ] GoatCounter: sign up at https://www.goatcounter.com, pick a site code, put it in
      `analytics.id`.
- [ ] Web3Forms: get an access key at https://web3forms.com using the lab's email, put it
      in `form.key`, then send yourself a test message.
- [ ] Set the real coordinates in `contact.map` (right-click the building on
      openstreetmap.org and choose "Show address" to read off the latitude and longitude).
- [ ] Buy the domain in the PI's name, set auto-renew, note the renewal date.
- [ ] Decide whether fonts need to be self-hosted for privacy.
