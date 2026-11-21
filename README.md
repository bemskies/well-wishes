# FESTIVE WELL WISHES

A JavaScript Christmas and New Year greeting app. Cloudflare Workers serves the pages and API, and Cloudflare D1 stores greetings. Each greeting has a cryptographically random link, a separate database record, and an optional parent link so recipients can pass the chain on.

## Features

- JavaScript Worker API with server-side validation and database constraints.
- Persistent D1 greeting records, unique 192-bit URL tokens, parent-child relationships, and creation timestamps.
- Dynamic greeting-card pages with server-rendered Open Graph and Twitter metadata.
- WhatsApp, Facebook, X, copy-link, and native sharing actions.
- Responsive festive design, snowfall, animated lights and balloons, a live clock, and Christmas/New Year countdowns.
- Embedded Jingle Bells video with an on-screen caption area.
- No Django, Flask, Python runtime, separate PostgreSQL provider, or secret key required.

The video is embedded from [YouTube](https://www.youtube.com/watch?v=3CWJNqyub3o); visitors may need to press Play because browsers can block autoplay. The requested licensed children’s-choir MP3 is not part of this version.

## Run locally

Install Node.js 22 or newer, then from the repository root:

```bash
npm install
npm run db:migrate:local
npm run dev
```

Open the local URL printed by Wrangler, usually `http://localhost:8787`. Wrangler runs the Worker and a local D1 database. Local database state is stored in `.wrangler/` and is not committed.

## Test

```bash
npm test
```

The test suite covers creation, separate unique links, parent-child chaining, form validation, invalid links, cross-origin submissions, HTML escaping, and server-rendered social metadata.

## Deploy for free on Cloudflare

Cloudflare Workers Free currently includes up to 100,000 Worker requests per day and D1 includes up to 100,000 writes per day, 5 million row reads per day, and 5 GB total storage. Exceeding free limits stops or rejects requests rather than automatically upgrading the account. See current [Workers pricing and limits](https://developers.cloudflare.com/workers/platform/pricing/) and [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) before deployment.

1. Create a free Cloudflare account and install Node.js 22 or newer. From the repository root, authenticate:

   ```bash
   npx wrangler login
   ```

2. Create the production D1 database:

   ```bash
   npx wrangler d1 create festive-well-wishes
   ```

   Copy the returned `database_id` into `wrangler.jsonc`, replacing `REPLACE_WITH_D1_DATABASE_ID`.
3. Apply the schema and deploy:

   ```bash
   npm run db:migrate:remote
   npm run deploy
   ```

4. Open the `workers.dev` URL printed by Wrangler. The app and database run on Cloudflare; a Google Cloud billing account or third-party PostgreSQL service is not needed.

For future releases, update the code on GitHub, pull it into the deployment checkout, then run `npm run deploy`. D1 migrations are tracked in `migrations/`; apply any new migration to the remote database with `npm run db:migrate:remote` before deploying code that depends on it.

## Verify the Person A → Person B → Person C chain

1. Person A creates a greeting; the app stores a record and redirects to `/g/<token>/`.
2. Person B opens that link and clicks **Create Your Own Greeting**. Their form starts with the original occasion, and their new record stores Person A’s token as its parent.
3. Person B’s link has a different token and shows their own greeting. Person A’s original greeting remains unchanged.
4. Person C can repeat the process from Person B’s link. Every greeting remains a separate record.
5. View a greeting’s page source to verify that its sender, recipient, personalized description, absolute preview image URL, and canonical greeting URL are present in Open Graph and Twitter metadata.

Social platforms cache link previews. To refresh a preview, use the platform's link-preview debugger/scraper or test with a newly created greeting link.

## Data and security notes

- Public greetings are intentionally readable by anyone who has the link. The API reads a single greeting by its unguessable token and has no listing endpoint.
- Database fields have length and choice constraints; user-provided text is HTML-escaped before rendering.
- The public creation endpoint accepts only same-origin browser submissions and does not expose a database credential or service-role key.
- D1 records are stored remotely. Local test data in an old Django SQLite file is not imported automatically; the earlier Django deployment was not live, so no deployed records were migrated.
- Back up important greetings by exporting the D1 database from Wrangler or the Cloudflare dashboard. The free tier has usage/storage limits and is not an uptime guarantee.

## Project layout

```text
src/index.js                       Worker routes, validation, and D1 access
src/pages.js                       Server-rendered greeting cards and metadata
migrations/                        D1 SQL migrations
static/index.html                  Homepage and greeting form
static/festive/css/site.css         Responsive festive styles
static/festive/js/site.js           Sharing, form, clock, and animation behavior
static/festive/images/              Tree, Santa, and social-card artwork
tests/worker.test.js                Worker behavior tests
wrangler.jsonc                     Cloudflare Worker and D1 configuration
```
