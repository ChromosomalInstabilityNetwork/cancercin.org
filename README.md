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
| `npm run og`         | Regenerates `public/og.png`; needs `CHROME_PATH`                   |

`test:links` and `test:a11y` read the built `dist/`, so run `npm run build` first with the same
`BASE_PATH` you want to test. Set `CHROME_PATH` to any Chrome or Chromium binary.

## Content

All collections are defined (and validated) in [`src/content.config.ts`](src/content.config.ts); a
field that is missing or the wrong type fails the build with a clear message. Entries in the seed
data are bracketed placeholders (`[Name 1]`) and should be replaced with real, verified content.

**People** come from Airtable, not from a file in this repository: see
[People directory (Airtable)](#people-directory-airtable).

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
`"chromosome mis-segregation"` (also spelt `"missegregation"`) and `"DNA damage response"`. It keeps the 200 newest results and rewrites `src/content/publications.yaml`. Entries whose `id` starts with `pmid-` are
generated and replaced each run. Each gets a `date` (`YYYY-MM-DD`, or `YYYY-MM` / `YYYY` when PubMed only knows part of it): the electronic publication date when PubMed has one, otherwise the issue date, which can lie in the future for upcoming issues; any other entry is hand-curated and kept. If PubMed is unreachable the
existing file is kept, so the build never breaks. The keywords are listed in
[`src/data/publication-keywords.json`](src/data/publication-keywords.json) (edit that file to change them; the
page's "Keywords used" pills come from it too). Each entry also records which of the keywords it matched
(`keywords`), shown in the Keyword column. The Publications page shows the first 40 rows and loads more as
you scroll; the full table is in the page, so it still works without JavaScript. Settings (environment variables): `PUBMED_QUERY`
(search term), `PUBS_MAX` (default 200), `NCBI_API_KEY` (a repository secret; raises the rate limit)
and `NCBI_EMAIL` (a repository variable; contact address NCBI asks tools to send). To change what is
listed, set `PUBMED_QUERY`, for example to restrict to consortium authors.

**Resource**: add to `src/content/resources.yaml` (`kind` = `method` | `data`, `title`, `category`,
`description`, `url`, `host` = `github` | `website` | `repository`, `label` for the button text).

**Working group**: a Markdown file in `src/content/working-groups/`. The body is the description and
`members` lists person `id`s (see [People directory](#people-directory-airtable)), in display order (a misspelt id fails the build).

```md
---
title: 'CIN Measurement Working Group'
order: 1 # position on the page
members: [pippa-cosper, teresa-davoli]
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
without JavaScript. Pins come from `/people.geojson`, built from listed members who have Mapped checked and
coordinates. Everyone is drawn as a face at their true location; faces that would overlap are pushed
apart (with a thin line back to the true spot) by a small collision pass in
[`PeopleMap.astro`](src/components/PeopleMap.astro), recomputed as you pan and zoom.

**Geocoding** turns a member's Affiliation and Location into coordinates with
[Nominatim](https://nominatim.org/release-docs/latest/api/Search/). Results are cached in
`.geocode-cache.json`; a build only queries Nominatim for places the cache does not have, at one
request per second (its usage policy), and only when `GEOCODE_CONTACT` is set. The deploy workflow
sets it, so a newly approved member gets a pin on the next build. Its lookups are not saved, so to
check a match and stop it being looked up again, run `npm run people` locally with `GEOCODE_CONTACT`
in `.env` and commit `.geocode-cache.json` (edit `lat`/`lng` there to correct a bad match). A member
whose place cannot be found is listed without a pin, and the build log names them.

**Changing the map style or provider:** the style URL is in
[`src/lib/mapConfig.ts`](src/lib/mapConfig.ts); the style is used as published, with no recolouring. The
default is OpenFreeMap's Positron (no key). Set `PUBLIC_MAP_STYLE_URL` (and `PUBLIC_MAP_KEY` if the URL contains
`{key}`) to switch; a client-side key is public by design, so restrict it to your domain with the
provider. Keep the attribution visible. Check the provider's current terms before relying on it.

## People directory (Airtable)

The directory, the map and the home-page "Our community" bubbles are built from the **Members** table
of an Airtable base. People apply with the "Join the network" form, on its own page at `/join/` and as a slide-in panel
on the home and People pages ([`JoinForm.astro`](src/components/JoinForm.astro)), which adds a row to that table. Before every
dev server start and build, [`scripts/build-people.mjs`](scripts/build-people.mjs) fetches the table
through [`scripts/airtable.mjs`](scripts/airtable.mjs) and writes `src/content/people.built.yaml`
(generated, not committed), which the site reads. The build fails, rather than publishing an empty
directory, if a variable is missing, the request fails or no member is approved.

**Setup.** Create an Airtable [personal access token](https://airtable.com/create/tokens) with the
`data.records:read` scope and access to the base. Under **Settings → Secrets and variables →
Actions** add the secret `AIRTABLE_TOKEN` and the variables `AIRTABLE_BASE_ID` (starts with `app`),
`AIRTABLE_TABLE` (`Members`) and `GEOCODE_CONTACT` (a contact email, sent to Nominatim). Locally,
put the same four in `.env`. The token is read only by the build script and never reaches the site.

**Fields**, looked up by name: Name, Role, Affiliation, Location, Group Website, Bluesky, Twitter,
LinkedIn, Headshot, and the checkboxes below. Role is shown under the name (except "Other"). Group Website is where the person's name links to.
Bluesky, Twitter and LinkedIn take a handle or a full profile URL and become the icons under the
person. Empty
fields are left out, and a value that is not a usable link is skipped with a warning in the build
log. Email and Mailing List are never requested from Airtable, so they cannot appear on the site.

**Approval** is three checkboxes on the member's row. Changes go live with the next deploy (daily, or
run the workflow by hand).

| Checkbox          | Effect                                                                     |
| ----------------- | -------------------------------------------------------------------------- |
| Approved          | Set by a maintainer. Nothing about a member is published without it.       |
| List In Directory | The member's choice to be listed. Needed, with Approved, to appear at all. |
| Mapped            | Adds a pin on the map for a listed member (needs a Location).              |

**Headshots.** An image (PNG, JPEG or WebP) attached to the Headshot field is downloaded during the
build to `src/img/people/airtable/` (not committed; Airtable's attachment links expire, so they are
never used on the site) and takes priority. Without one, the file in `src/img/people/` named after
the person is used (`first-last.png` or the full slug of the name), and otherwise a placeholder
avatar. The build log lists who is using a file from the repository.

Working groups refer to people by `id`, the slug of the Name ("Jan Oliver Korbel" → `jan-oliver-korbel`),
so renaming a member in Airtable means updating their working groups.

## Environment variables

For local use, set these in a `.env` file in the repository root (not committed). Variables
prefixed `PUBLIC_` are embedded in the built site.

| Variable               | Used by | Purpose                                                   |
| ---------------------- | ------- | --------------------------------------------------------- |
| `SITE_URL`             | build   | Public origin (canonical URLs, sitemap, social images)    |
| `BASE_PATH`            | build   | Sub-path for a project page (`/repo`); unset for a domain |
| `PUBLIC_MAP_STYLE_URL` | build   | Alternative MapLibre style URL                            |
| `PUBLIC_MAP_KEY`       | build   | Public, domain-restricted key substituted for `{key}`     |
| `AIRTABLE_TOKEN`       | build   | Secret Airtable token that reads the Members table        |
| `AIRTABLE_BASE_ID`     | build   | Airtable base id (`app…`)                                 |
| `AIRTABLE_TABLE`       | build   | Airtable table name (`Members`)                           |
| `GEOCODE_CONTACT`      | build   | Contact email for Nominatim; enables geocoding            |

All internal links and assets go through `url()` in [`src/lib/url.ts`](src/lib/url.ts), so the site
works under any base path.

## Deployment

Pushes to `main` (and the daily schedule) run [`deploy.yml`](.github/workflows/deploy.yml), which
builds with `withastro/action` and publishes with `actions/deploy-pages`.

**One-time setup:** in the GitHub repository go to **Settings → Pages → Source** and choose
**GitHub Actions**. Under **Settings → Secrets and variables → Actions → Variables** set the
following, plus the [Airtable secret and variables](#people-directory-airtable):

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

The mailing-list signup form (plan Phase 5) is not implemented. The featured consortium Perspective on the
Publications page was removed for now (its placeholder entry is still in `publications.yaml`).
