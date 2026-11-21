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

### Low-traffic deployment (Google Cloud Run + Neon)

The app is containerized for [Google Cloud Run](https://cloud.google.com/run), with [Neon Free](https://neon.com/pricing) providing persistent PostgreSQL storage. Cloud Run's free usage allowance includes, in `us-central1`, 2 million requests and monthly CPU/RAM quotas; Neon Free currently includes 100 compute-hours and 1 GB of storage per project. Both services can scale to zero, so the first visit after inactivity may be slow. This is a low-traffic hobby setup, not an always-on or production availability guarantee.

**Billing warning:** Cloud Run requires a Google Cloud billing account. Usage within its free allowance is not charged, but usage beyond the allowance, other Google Cloud services, or unexpected traffic can incur charges. Set a budget alert and review the current [Cloud Run pricing](https://cloud.google.com/run/pricing) and [Neon pricing](https://neon.com/pricing) before deploying; budget alerts are notifications, not a hard spending cap.

1. Create a Google Cloud project, attach a billing account, install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install), and authenticate:

   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
   ```

2. Create a free Neon project and database. Copy its pooled PostgreSQL connection string. In Google Cloud Console, open **Security → Secret Manager** and create secrets named `DATABASE_URL` and `DJANGO_SECRET_KEY`. Store the Neon connection string in the first; generate the second locally with `python -c 'import secrets; print(secrets.token_urlsafe(48))'`. Do not put either value in source control or in shell command arguments.
3. Give the default Cloud Run runtime identity access to both secrets. Get the project number with `gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)'`; the default identity is `PROJECT_NUMBER-compute@developer.gserviceaccount.com`. Grant it access to each secret:

   ```bash
   gcloud secrets add-iam-policy-binding DATABASE_URL \
     --member=serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com \
     --role=roles/secretmanager.secretAccessor
   gcloud secrets add-iam-policy-binding DJANGO_SECRET_KEY \
     --member=serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com \
     --role=roles/secretmanager.secretAccessor
   ```

   Use the secrets as runtime environment variables named `DATABASE_URL` and `DJANGO_SECRET_KEY`.
4. From the repository root, deploy the source. The Dockerfile collects static assets during image build and runs database migrations when a container starts:

   ```bash
   gcloud run deploy festive-well-wishes \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --max 1 \
     --memory 512Mi \
     --cpu 1 \
     --set-env-vars="DJANGO_DEBUG=False,DJANGO_ALLOWED_HOSTS=.run.app,DJANGO_CSRF_TRUSTED_ORIGINS=https://*.run.app" \
     --set-secrets DJANGO_SECRET_KEY=DJANGO_SECRET_KEY:latest,DATABASE_URL=DATABASE_URL:latest
   ```

   If prompted, allow Google Cloud to enable required APIs or create an Artifact Registry repository. The initial host entries permit Cloud Run's generated URL; immediately after deployment, replace `.run.app` and `https://*.run.app` with the exact service hostname and HTTPS origin shown by `gcloud run services describe festive-well-wishes --region us-central1 --format='value(status.url)'`. Set them in Cloud Run's **Edit and deploy new revision → Variables & Secrets** page and redeploy.

5. Open the service URL from the command output. Verify the homepage, create a greeting, and open its unique link. On the first cold start, connecting to the sleeping Neon database can take longer than usual.

The `--max 1` setting limits Cloud Run scaling and helps keep compute and database use predictable; it also limits capacity. The app database lives in Neon, not on Cloud Run's temporary container filesystem. See [Cloud Run source deployment documentation](https://cloud.google.com/run/docs/deploying-source-code) and [Neon's free plan limits](https://neon.com/pricing).

`SECURE_SSL_REDIRECT` defaults to enabled in production. Cloud Run terminates HTTPS and forwards the original scheme so Django's secure-cookie and HTTPS settings work behind its proxy.

## Project layout

```text
config/                       Django settings, root URLs, and WSGI
festive/                      Greeting model, form, views, admin, and tests
festive/migrations/           Database schema migrations
Dockerfile                    Cloud Run container build and start command
.dockerignore                 Excludes local and secret files from container builds
static/festive/css/            Responsive design and animation styles
static/festive/images/         Social card artwork and favicon
static/festive/js/             Music, sharing, and snowfall interactions
templates/                     Shared layout and greeting pages
scripts/                       Social-card image generator
```
