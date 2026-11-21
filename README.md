# FESTIVE WELL WISHES

A mobile-friendly Django website for creating, sharing, and passing on personalized Christmas and New Year greetings. Every greeting is stored as its own record with a secure, unique public link. A recipient can make a new greeting linked to the one they received, continuing the sharing chain without changing the original.

## Features

- Django 5.2 application with SQLite for local development and PostgreSQL through `DATABASE_URL` in production.
- Separate greeting records, URL-safe random tokens, a database uniqueness constraint, indexed creation dates, and a parent/child relationship.
- Server-validated forms with a required recipient name and required, user-written well-wishing message, CSRF protection, and Django admin.
- Individual server-rendered greeting cards with Open Graph and Twitter Card metadata.
- WhatsApp, Facebook, X, copy-link, and supported-device native sharing actions.
- Responsive layouts, keyboard-visible focus, reduced-motion support, decorative snowfall, and a custom 1200 × 630 PNG social preview.
- Ruby-red homepage styling, a custom Father Christmas illustration, gently floating balloon decorations, a live visitor-local clock, and separate annual Christmas/New Year countdowns.
- A locally served, decorated Christmas tree photograph with animated colored disco lights, plus a responsive YouTube Jingle Bells video player with an on-screen caption area.

The tree photograph is served locally from an [Unsplash image](https://images.unsplash.com/photo-1543589077-47d81606c1bf). The embedded video is [Jingle Bells with Lyrics](https://www.youtube.com/watch?v=3CWJNqyub3o) from Christmas Songs and Carols. It is embedded from YouTube rather than downloaded; YouTube/browser autoplay restrictions may require the visitor to press Play. Captions are requested in the player and can be enabled with CC if available.
- WhiteNoise static-file serving and Gunicorn deployment entrypoint.

## Run in GitHub Codespaces or locally

Python 3.11 or newer is required (the project has also been checked with Python 3.14).

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

In Codespaces, open port **8000** in the Ports tab. Local development uses SQLite and does not require PostgreSQL. Settings load values from the optional, git-ignored `.env` file as well as environment variables; environment variables take precedence. The development defaults work without `.env`.

To create an administrator account and use `/admin/`:

```bash
python manage.py createsuperuser
```

## Test and check

```bash
python manage.py test
python manage.py check
python manage.py makemigrations --check --dry-run
```

## Test the sharing chain

1. Open the homepage, fill out the form as Person A, and submit. The personalized card URL looks like `/g/<unique-token>/`.
2. On that card, use **Create Your Own Greeting**. The form carries forward the original occasion. Enter Person B's information and submit.
3. Confirm Person B's link has a different token and shows Person B's greeting. Person A's link still displays Person A's original card.
4. Repeat from Person B's card for Person C. Each new record has the greeting that inspired it as its parent; no existing greeting is overwritten.
5. Try the sharing actions on an HTTPS browser. Copy Link confirms success with an on-page message; the device Share button only appears where the Web Share API is available.

## Social preview image

The checked-in `static/festive/images/social-card.png` is a 1200 × 630 PNG used for server-rendered `og:image` and `twitter:image` metadata. Its editable SVG counterpart is `static/festive/images/social-card.svg`. To regenerate the PNG after changing the design:

```bash
python scripts/generate_social_card.py
```

Social platforms cache link previews. After deploying a change, use the platform's link-preview debugger/scraper to request a fresh scrape, or test a new URL (for example, a new greeting token). Verify the HTML source contains the absolute HTTPS image URL and that the image is publicly fetchable; local `localhost` previews cannot be fetched by social crawlers.

## Deployment

### Free hobby deployment (Render + Neon)

The included [`render.yaml`](./render.yaml) creates a **free Render web service**. For persistent greeting records, pair it with a **Neon Free PostgreSQL** database and set the Render `DATABASE_URL` environment variable to Neon’s connection string. Never commit the connection string or add it to `.env.example`.

1. Push this repository to GitHub and connect it to Render, then create a Blueprint from the repository. Render generates `DJANGO_SECRET_KEY`; the Blueprint asks for `DATABASE_URL`.
2. Create a Neon project on its free plan. Choose a region near the Render service and copy the pooled PostgreSQL connection string from Neon.
3. Paste that URL into the Render Blueprint prompt (or set `DATABASE_URL` in the Render service’s Environment settings), then apply/redeploy the Blueprint. The start command runs migrations before starting Gunicorn.
4. Open the Render service URL after its deploy finishes. `RENDER_EXTERNAL_HOSTNAME` is automatically allowed for both hosts and CSRF.

Both plans are free, but have limits: Render free services sleep after 15 minutes idle and can take about a minute to wake; its local filesystem is ephemeral. Neon Free currently includes 1 GB database storage per project, 100 compute-hours per month, and 5 GB public data transfer, and suspends compute after inactivity. This is a hobby/preview configuration, not a production availability or scale guarantee. See the current [Render free plan limits](https://render.com/docs/free) and [Neon plan limits](https://neon.com/docs/introduction/plans) before relying on them.

The production settings require `DATABASE_URL`, so the service will refuse to start rather than store greetings in ephemeral SQLite if the PostgreSQL URL is missing. For a production launch, use an appropriately backed-up, persistent PostgreSQL plan.

For a custom domain, follow Render's DNS setup and enable HTTPS. The app trusts Render's forwarded HTTPS header and enables secure cookies, HTTPS redirects, and HSTS when `DJANGO_DEBUG=False`.

`SECURE_SSL_REDIRECT` defaults to enabled in production and can be set to `False` only when HTTPS termination is not yet available. Set `SECURE_HSTS_SECONDS` only after confirming HTTPS works reliably for the domain and its subdomains.

## Project layout

```text
config/                       Django settings, root URLs, and WSGI
festive/                      Greeting model, form, views, admin, and tests
festive/migrations/           Database schema migrations
render.yaml                   Render free web service Blueprint
static/festive/css/            Responsive design and animation styles
static/festive/images/         Social card artwork and favicon
static/festive/js/             Music, sharing, and snowfall interactions
templates/                     Shared layout and greeting pages
scripts/                       Social-card image generator
```
