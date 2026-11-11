# Contributing

You do not need to be a developer to update this site. All of the content lives in plain text files
in [`src/content/`](src/content/), and you can edit them in the GitHub web editor.

## Editing a file on GitHub

1. Open the file on GitHub and click the pencil icon (**Edit this file**).
2. Make your change. Copy an existing entry and edit it if you are adding a new one.
3. Click **Commit changes…**, choose **Create a new branch and start a pull request**, and submit.
4. A maintainer reviews the pull request. Automated checks run on it; when they pass and it is
   approved, merging publishes the change within a few minutes.

Please do not invent details. Leave a field out rather than guessing it, and only add links you have
opened and checked.

## What to edit

| To change…                | Edit…                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------- |
| A person in the directory | the Airtable Members table (see the README)                                        |
| An event                  | add or edit a file in [`src/content/events/`](src/content/events/)                 |
| A working group           | add or edit a file in [`src/content/working-groups/`](src/content/working-groups/) |
| A news item               | add or edit a file in [`src/content/news/`](src/content/news/)                     |
| A publication             | automatic: fetched from PubMed on each deploy (see the README)                     |
| A method or dataset       | [`src/content/resources.yaml`](src/content/resources.yaml)                         |

The README has the full list of fields for each. Page text for the About and Challenges & Roadmap
pages is in `src/pages/about/` and `src/data/`.

### Adding yourself to the directory

Use the **Join the network** form on the People page. Give your location as city, state or province (if applicable) and
country; please don't add street addresses. You choose there whether to be listed in the directory and shown on the map, and can add a website, Bluesky and Twitter/X handles, LinkedIn and a headshot. A maintainer approves each entry before it appears.

### Images

Put image files under `public/` (for example `public/images/news/launch.jpg`) and refer to them
without the `public/` prefix (`image: images/news/launch.jpg`). Headshots are uploaded with the Join form. Please keep them small (about 200 px square is plenty for
thumbnails and portraits) and include `image_alt` text when a picture carries meaning.

## For developers

```sh
npm install
npm run dev          # http://localhost:4321
npm run lint && npm run format:check && npm run check
npm run build && npm run test:links
```

`npm run format` fixes formatting. See the README for the accessibility check and deployment.
