const TITLES = {
  christmas: "Merry Christmas",
  new_year: "Happy New Year",
  both: "Merry Christmas & Happy New Year",
};

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function videoPlayer() {
  return `
    <section class="music-player video-music-card" aria-label="Jingle Bells music video">
      <div class="music-video-heading">
        <span class="music-icon" aria-hidden="true">♫</span>
        <div class="music-copy">
          <span class="eyebrow">A festive sing-along</span>
          <strong>Jingle Bells with Lyrics</strong>
          <span class="music-status">Christmas Songs HD · Christmas Songs and Carols</span>
        </div>
      </div>
      <figure class="music-video">
        <div class="music-video-frame">
          <iframe src="https://www.youtube-nocookie.com/embed/3CWJNqyub3o?autoplay=1&amp;playsinline=1&amp;cc_load_policy=1&amp;rel=0"
            title="Jingle Bells with Lyrics | Christmas Songs HD | Christmas Songs and Carols"
            allow="autoplay; encrypted-media; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        </div>
        <figcaption class="music-video-caption">
          <span class="caption-icon" aria-hidden="true">♪</span>
          <span><b>Jingle Bells</b> · Sing along with the on-screen lyrics. Use the player’s CC control for captions when available.</span>
          <a href="https://www.youtube.com/watch?v=3CWJNqyub3o" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a>
        </figcaption>
      </figure>
    </section>`;
}

function pageShell({ title, description, bodyClass, content, socialMeta = "" }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#10382b">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  ${socialMeta}
  <link rel="icon" href="/festive/images/snowflake.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/festive/css/site.css">
  <script defer src="/festive/js/site.js"></script>
</head>
<body class="${escapeHtml(bodyClass)}">
  <canvas class="snow-canvas" aria-hidden="true"></canvas>
  <div class="page-shell">
    <a class="skip-link" href="#main-content">Skip to content</a>
    <header class="site-header">
      <a class="brand" href="/" aria-label="Festive Well Wishes home">
        <span class="brand-mark" aria-hidden="true">✦</span>
        <span class="brand-words">FESTIVE <b>WELL WISHES</b></span>
      </a>
      <nav class="main-nav" aria-label="Main navigation">
        <a href="/">Home</a>
        <a href="/#create">Create Greeting</a>
        <a href="/#about">About</a>
      </nav>
      <a class="header-cta" href="/#create">Make a wish <span aria-hidden="true">↗</span></a>
    </header>
    <main id="main-content">${content}</main>
    <footer class="site-footer">
      <a class="footer-brand" href="/">FESTIVE WELL WISHES</a>
      <span>Made to share a little more joy. <span aria-hidden="true">✦</span></span>
      <a href="/#about">Our festive spirit</a>
    </footer>
  </div>
</body>
</html>`;
}

export function renderGreetingPage(greeting, requestUrl) {
  const greetingTitle = TITLES[greeting.occasion];
  const wishDescription = `${greeting.sender_name} wishes ${greeting.recipient_name} ${greetingTitle}. Open this festive greeting and pass the joy along.`;
  const pageUrl = new URL(`/g/${encodeURIComponent(greeting.unique_token)}/`, requestUrl).href;
  const imageUrl = new URL("/festive/images/social-card.png", requestUrl).href;
  const socialTitle = `${greeting.sender_name} sends you a wish · FESTIVE WELL WISHES`;
  const socialMeta = `
  <meta property="og:title" content="${escapeHtml(socialTitle)}">
  <meta property="og:description" content="${escapeHtml(wishDescription)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/png">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(socialTitle)}">
  <meta name="twitter:description" content="${escapeHtml(wishDescription)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">`;
  const title = `${greeting.sender_name} sends you a wish — FESTIVE WELL WISHES`;
  const greetingUrl = escapeHtml(pageUrl);
  const greetingTitleEncoded = encodeURIComponent(greetingTitle);
  const senderEncoded = encodeURIComponent(greeting.sender_name);
  const wishText = greeting.personal_note
    ? `<p class="card-wish">${escapeHtml(greeting.personal_note)}</p>`
    : "";
  const content = `
<section class="greeting-page">
  <div class="greeting-intro"><span class="season-pill">A FESTIVE WISH FOR YOU <span aria-hidden="true">✦</span></span><p>Someone special thought of you.</p></div>
  <article class="greeting-card">
    <div class="card-corner corner-tl">✧</div><div class="card-corner corner-tr">✧</div>
    <div class="card-lights" aria-hidden="true"><span>●</span><span>●</span><span>●</span><span>●</span><span>●</span><span>●</span><span>●</span></div>
    <div class="card-inner">
      <span class="card-snowflake" aria-hidden="true">❄</span>
      <span class="card-label">FESTIVE WISHES TO YOU ${escapeHtml(greeting.recipient_name.toUpperCase())}</span>
      <h1>${escapeHtml(greetingTitle)}</h1>
      <span class="card-divider" aria-hidden="true">✦ &nbsp; ✧ &nbsp; ✦</span>
      ${wishText}
      <p class="card-sender">${escapeHtml(greeting.sender_name)}</p>
      <span class="card-end-star" aria-hidden="true">✦</span>
    </div>
    <div class="card-corner corner-bl">✧</div><div class="card-corner corner-br">✧</div>
  </article>
  <div class="greeting-share">
    <p>A little joy looks lovely on you. Pass it along?</p>
    <div class="share-buttons">
      <a class="share-button share-whatsapp" href="https://wa.me/?text=${greetingTitleEncoded}%20from%20${senderEncoded}%3A%20${encodeURIComponent(pageUrl)}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">◉</span> WhatsApp</a>
      <a class="share-button share-facebook" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">f</span> Facebook</a>
      <a class="share-button share-x" href="https://twitter.com/intent/tweet?text=${greetingTitleEncoded}%20from%20${senderEncoded}&amp;url=${encodeURIComponent(pageUrl)}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">𝕏</span> Post</a>
      <button class="share-button share-copy" type="button" data-copy-link="${greetingUrl}"><span aria-hidden="true">⌁</span> Copy link</button>
      <button class="share-button share-native" type="button" data-native-share data-share-title="${escapeHtml(greeting.sender_name)} sends you a wish" data-share-text="${escapeHtml(greetingTitle)} · FESTIVE WELL WISHES" data-share-url="${greetingUrl}" hidden><span aria-hidden="true">↗</span> Share</button>
    </div>
    <p class="copy-feedback" data-copy-feedback role="status" aria-live="polite"></p>
  </div>
  <div class="greeting-next">
    <span aria-hidden="true" class="next-sparkle">✧</span>
    <p>Now it's your turn to share a little wonder.</p>
    <a class="button button-gold" href="/?from=${encodeURIComponent(greeting.unique_token)}#create">Create Your Own Greeting <span aria-hidden="true">→</span></a>
  </div>
  <div class="greeting-music">${videoPlayer()}</div>
</section>`;

  return pageShell({
    title,
    description: wishDescription,
    bodyClass: "greeting-theme",
    content,
    socialMeta,
  });
}

export function renderNotFoundPage() {
  const content = `
<section class="subpage-hero">
  <span class="season-pill">A LITTLE DETOUR</span>
  <h1>This greeting <em>has wandered off.</em></h1>
  <p>That link may be incorrect or no longer available. You can make a new wish and share it with someone special.</p>
  <a class="button button-gold" href="/#create">Create Your Greeting <span aria-hidden="true">→</span></a>
</section>`;
  return pageShell({
    title: "Greeting not found — FESTIVE WELL WISHES",
    description: "This greeting link could not be found.",
    bodyClass: "greeting-theme",
    content,
  });
}
