# International CIN Network website

A static site for the International CIN Network, built with [Astro](https://astro.build) and deployed to
GitHub Pages. Content is plain files in `src/content/`, so it can be edited without code (see
[CONTRIBUTING.md](CONTRIBUTING.md)).

## Setup

Requires Node 22.12 or newer.

```sh
npm install
npm run dev       # dev server at http://localhost:4321
npm run build     # static site in dist/
npm run preview   # serve dist/ locally
```

### Scripts

| Script               | What it does                                                       |
| -------------------- | ------------------------------------------------------------------ |
| `npm run lint`       | ESLint                                                             |
| `npm run format`     | Prettier, writes changes (`format:check` only reports)             |
| `npm run check`      | `astro check` (types and Astro diagnostics)                        |
| `npm run test:links` | Fails on broken internal links, assets and `#fragments` in `dist/` |
| `npm run test:a11y`  | axe-core (WCAG A/AA) on every built page; needs `CHROME_PATH`      |
| `npm run geocode`    | Fills in missing map coordinates for people (see below)            |
| `npm run og`         | Regenerates `public/og.png`; needs `CHROME_PATH`                   |

`test:links` and `test:a11y` read the built `dist/`, so run `npm run build` first with the same
`BASE_PATH` you want to test. Set `CHROME_PATH` to any Chrome or Chromium binary.

## Content

All collections are defined (and validated) in [`src/content.config.ts`](src/content.config.ts); a
field that is missing or the wrong type fails the build with a clear message. Entries in the seed
data are bracketed placeholders (`[Name 1]`) and should be replaced with real, verified content.

**Person**: add to `src/content/people.yaml` (only `id` and `name` are required):

```yaml
- id: jane-doe # unique, URL-safe; also the #anchor used by links from the home page
  name: 'Jane Doe'
  institution: 'Example University'
  city: 'City' # location is city / state / country; no street addresses
  state: 'State' # optional, where it applies
  country: 'Country'
  photo: people/jane-doe.jpg # optional; file in public/people/
  website: 'https://…' # optional links, shown as icons under the person (full URLs)
  bluesky: 'https://bsky.app/profile/jane.bsky.social'
  x: 'https://x.com/jane'
  linkedin: 'https://www.linkedin.com/in/jane'
  show_on_map: true # false = listed, but no pin
  # lat / lng are filled in by `npm run geocode`, or set by hand (never overwritten)
```

People without a city and country have no pin. The directory and the home-page "Our community" bubbles
both come from this file. If a person has a `website`, their name in the directory links to it.

**Event**: a Markdown file in `src/content/events/`. The body is the description.

```md
---
title: 'Monthly CIN lecture'
start: 2027-01-14 # omit if the date is not announced
end: 2027-01-15 # optional
location: 'Online'
type: lecture # lecture | session | workshop
link: 'https://…' # optional
image: images/events/lecture.jpg # optional thumbnail, file in public/
image_alt: ''
---

Talks from across the CIN community.
```

**News**: a Markdown file in `src/content/news/` with `title`, `date`, `summary`, and optionally
`link`, `image`, `image_alt`. The body becomes the post page.

**Publications** are fetched from PubMed on every deploy by
[`scripts/fetch-publications.mjs`](scripts/fetch-publications.mjs) (`npm run publications` to run it
locally). It searches PubMed titles and abstracts for any of: `"chromosomal instability"`, `"tumor evolution"`
(or `"tumour evolution"`), `"aneuploidy"` together with `"cancer"`, `"replication stress"`,
`"chromosome mis-segregation"`, `"chromosome missegregation"` and `"DNA damage response"`. It keeps the 200 newest results and rewrites `src/content/publications.yaml`. Entries whose `id` starts with `pmid-` are
generated and replaced each run. Each gets a `date` (`YYYY-MM-DD`, or `YYYY-MM` / `YYYY` when PubMed only knows part of it): the electronic publication date when PubMed has one, otherwise the issue date, which can lie in the future for upcoming issues; any other entry is hand-curated and kept. If PubMed is unreachable the
existing file is kept, so the build never breaks. Settings (environment variables): `PUBMED_QUERY`
(search term), `PUBS_MAX` (default 200), `NCBI_API_KEY` (a repository secret; raises the rate limit)
and `NCBI_EMAIL` (a repository variable; contact address NCBI asks tools to send). To change what is
listed, set `PUBMED_QUERY`, for example to restrict to consortium authors.

**Resource**: add to `src/content/resources.yaml` (`kind` = `method` | `data`, `title`, `category`,
`description`, `url`, `host` = `github` | `website` | `repository`, `label` for the button text).

**Working group**: a Markdown file in `src/content/working-groups/`. The body is the description and
`members` lists person `id`s from `people.yaml`, in display order (a misspelt id fails the build).

```md
---
title: 'CIN Measurement Working Group'
order: 1 # position on the page
members: [pippa-f-cosper, teresa-davoli]
---

What the group is working on.
```

**Navigation** (and the footer site map and section side-menus) come from one list in
[`src/lib/site.ts`](src/lib/site.ts).

### Upcoming vs past events

Events are split into upcoming and past when the site is built. Because the site is static, a
scheduled GitHub Action rebuilds and redeploys it every day (05:15 UTC, see
[`deploy.yml`](.github/workflows/deploy.yml)) so events move to "past" on their own. Events with no
`start` date count as upcoming.

## Map and geocoding

The People page shows a directory plus a [MapLibre GL JS](https://maplibre.org) map. MapLibre is
loaded only on that page, when the map nears the viewport. The directory is plain HTML and works
without JavaScript. Pins come from `/people.geojson`, built from people who have coordinates and
`show_on_map: true`. Everyone is drawn as a face at their true location; faces that would overlap are pushed
apart (with a thin line back to the true spot) by a small collision pass in
[`PeopleMap.astro`](src/components/PeopleMap.astro), recomputed as you pan and zoom.

**Geocoding** is run by hand, locally; never in CI and never in a visitor's browser:

```sh
GEOCODE_CONTACT=you@example.org npm run geocode            # writes people.yaml
GEOCODE_CONTACT=you@example.org node scripts/geocode.mjs --dry-run
```

It only fills in people with no `lat`/`lng`, so coordinates you set by hand are never overwritten. It
uses [Nominatim](https://nominatim.org/release-docs/latest/api/Search/) at one request per second
(its usage policy), caches results in `.geocode-cache.json` (commit it so re-runs never re-query), and
prints a table of query, coordinates and matched place so you can spot bad matches. To use a
different provider, replace the `provider` object in `scripts/geocode.mjs`; read any API key from an
environment variable and never commit it. It looks people up by institution, city, state and country; no street addresses are stored.
Get consent before publishing names and locations.

**Changing the map style or provider:** the style URL is in
[`src/lib/mapConfig.ts`](src/lib/mapConfig.ts); the style is used as published, with no recolouring. The
default is OpenFreeMap's Positron (no key). Set `PUBLIC_MAP_STYLE_URL` (and `PUBLIC_MAP_KEY` if the URL contains
`{key}`) to switch; a client-side key is public by design, so restrict it to your domain with the
provider. Keep the attribution visible. Check the provider's current terms before relying on it.

## Environment variables

See [`.env.example`](.env.example).

| Variable               | Used by      | Purpose                                                   |
| ---------------------- | ------------ | --------------------------------------------------------- |
| `SITE_URL`             | build        | Public origin (canonical URLs, sitemap, social images)    |
| `BASE_PATH`            | build        | Sub-path for a project page (`/repo`); unset for a domain |
| `PUBLIC_MAP_STYLE_URL` | build        | Alternative MapLibre style URL                            |
| `PUBLIC_MAP_KEY`       | build        | Public, domain-restricted key substituted for `{key}`     |
| `GEOCODE_CONTACT`      | geocode only | Contact email for Nominatim's User-Agent                  |

All internal links and assets go through `url()` in [`src/lib/url.ts`](src/lib/url.ts), so the site
works under any base path.

## Deployment

Pushes to `main` (and the daily schedule) run [`deploy.yml`](.github/workflows/deploy.yml), which
builds with `withastro/action` and publishes with `actions/deploy-pages`.

**One-time setup:** in the GitHub repository go to **Settings → Pages → Source** and choose
**GitHub Actions**. Under **Settings → Secrets and variables → Actions → Variables** set:

| Hosting                                  | `SITE_URL`                 | `BASE_PATH` |
| ---------------------------------------- | -------------------------- | ----------- |
| Project page (`<user>.github.io/<repo>`) | `https://<user>.github.io` | `/<repo>`   |
| Custom domain (CancerCIN.org)            | `https://cancercin.org`    | _(unset)_   |

### Custom domain

1. Create `public/CNAME` containing just the domain (for example `cancercin.org`).
2. Set the `SITE_URL` variable to `https://cancercin.org` and delete `BASE_PATH`.
3. In **Settings → Pages**, enter the custom domain and enable **Enforce HTTPS**.
4. At your DNS provider, point the domain at GitHub Pages (see
   [GitHub's guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)).

## Quality checks

[`ci.yml`](.github/workflows/ci.yml) runs on every pull request and push to `main`: lint, formatting,
`astro check`, a production build **under a sub-path** (so base-path mistakes fail), the link check
and the axe accessibility check.

Lighthouse (mobile, run locally against a production build): Home, About, People and Publications
all scored 99 for Performance and 100 for Accessibility, Best Practices and SEO. The map is the
expensive part of the People page: in an earlier layout it cost about 1.5 s of main-thread blocking and
scored about 50, so re-check that page after changing the map or its position. The library is
code-split, loaded only on that page, and started lazily; the directory beside it is usable
immediately.

## Not built yet

The mailing-list signup form (plan Phase 5) is not implemented. The "Would you like to be added?"
card on the People page uses a plain `mailto:` link. The featured consortium Perspective on the
Publications page was removed for now (its placeholder entry is still in `publications.yaml`).
