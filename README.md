# Cancer CIN Consortium website

Static site built with [Astro](https://astro.build) and deployed to GitHub Pages.

## Develop

```sh
npm install
npm run dev
npm run build
```

## Deploy

Deployment runs from `.github/workflows/deploy.yml` on every push to `main`.

**One-time setup:** in the GitHub repo go to Settings → Pages → Source and choose **GitHub Actions**.

### Base path / custom domain

`astro.config.mjs` reads two environment variables, set in the workflow from repository variables
(Settings → Secrets and variables → Actions → Variables):

| Variable | Project page | Custom domain |
|---|---|---|
| `SITE_URL` | `https://<user>.github.io` | `https://cancercin.org` |
| `BASE_PATH` | `/<repo>` | *(unset)* |

For a custom domain also add a `public/CNAME` file containing the domain.
All internal links and assets must go through `url()` in `src/lib/url.ts`.
