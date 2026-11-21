# FESTIVE WELL WISHES

A mobile-friendly Django website for creating, sharing, and passing on personalized Christmas and New Year greetings. Every greeting is stored as its own record with a secure, unique public link. A recipient can make a new greeting linked to the one they received, continuing the sharing chain without changing the original.

## Features

- Django 5.2 application with SQLite for local development and PythonAnywhere's persistent SQLite storage; other production hosts can use PostgreSQL through `DATABASE_URL`.
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

### Free hobby deployment (PythonAnywhere)

PythonAnywhere's free Beginner account includes one public web app at `yourusername.pythonanywhere.com`, free HTTPS, a persistent home directory, 512 MB disk space, and limited daily CPU. This project can use SQLite there, so a separate paid database is not required. The free account has restricted outbound internet; this app does not need server-side access to YouTube because the music video is embedded in each visitor's browser.

1. Create a free [PythonAnywhere Beginner account](https://www.pythonanywhere.com/registration/register/beginner/). In the **Web** tab, create a **Manual configuration** web app using Python 3.11 or newer.
2. In a Bash console, clone this public repository and create a virtual environment:

   ```bash
   git clone https://github.com/bemskies/well-wishes.git
   cd well-wishes
   mkvirtualenv --python=/usr/bin/python3.11 well-wishes
   pip install -r requirements.txt
   ```

3. Create a private `.env` file in the project root (replace `yourusername` with your actual PythonAnywhere username). Generate a secret with `python -c 'import secrets; print(secrets.token_urlsafe(48))'`, then add:

   ```dotenv
   DJANGO_SECRET_KEY=your-generated-secret
   DJANGO_DEBUG=False
   DJANGO_ALLOWED_HOSTS=yourusername.pythonanywhere.com
   DJANGO_CSRF_TRUSTED_ORIGINS=https://yourusername.pythonanywhere.com
   PYTHONANYWHERE_SITE=True
   ```

   Keep `.env` private; it is excluded from Git. Restrict its permissions with `chmod 600 .env`. `PYTHONANYWHERE_SITE=True` selects SQLite at `db.sqlite3` inside the persistent project directory. Production settings refuse to silently use SQLite on other hosts.

4. Configure the PythonAnywhere web app's virtualenv to `~/.virtualenvs/well-wishes`. Set its source/working directory to `/home/yourusername/well-wishes`.
5. In the PythonAnywhere WSGI configuration file, replace the contents with this (update the username):

   ```python
   import os
   import sys

   project_path = "/home/yourusername/well-wishes"
   if project_path not in sys.path:
       sys.path.insert(0, project_path)
   os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

   from django.core.wsgi import get_wsgi_application
   application = get_wsgi_application()
   ```

6. In the Bash console, activate the virtualenv, then run:

   ```bash
   cd ~/well-wishes
   workon well-wishes
   python manage.py migrate
   python manage.py collectstatic --noinput
   ```

7. In the Web tab's **Static files** section, map URL `/static/` to `/home/yourusername/well-wishes/staticfiles`, then click **Reload** and open your `yourusername.pythonanywhere.com` address.

The free tier's 512 MB disk and CPU quota are suitable for a small hobby site, not a guarantee of production capacity or high availability. Keep backups of `db.sqlite3`; the site uses one SQLite database file in the account's persistent storage. See [PythonAnywhere free account details](https://www.pythonanywhere.com/pricing/) and [Django deployment instructions](https://help.pythonanywhere.com/pages/DeployExistingDjangoProject/).

`SECURE_SSL_REDIRECT` defaults to enabled in production and can be set to `False` only when HTTPS termination is not yet available. Set `SECURE_HSTS_SECONDS` only after confirming HTTPS works reliably for the domain and its subdomains.

## Project layout

```text
config/                       Django settings, root URLs, and WSGI
festive/                      Greeting model, form, views, admin, and tests
festive/migrations/           Database schema migrations
static/festive/css/            Responsive design and animation styles
static/festive/images/         Social card artwork and favicon
static/festive/js/             Music, sharing, and snowfall interactions
templates/                     Shared layout and greeting pages
scripts/                       Social-card image generator
```
