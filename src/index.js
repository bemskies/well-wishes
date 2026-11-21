import { renderGreetingPage, renderNotFoundPage } from "./pages.js";

const OCCASIONS = new Set(["christmas", "new_year", "both"]);
const STYLES = new Set([
  "heartwarming",
  "romantic",
  "funny",
  "inspirational",
  "spiritual",
  "professional",
  "family",
]);

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function cleanText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength + 1) : "";
}

async function getGreeting(env, token) {
  return env.DB.prepare(
    `SELECT unique_token, sender_name, recipient_name, occasion,
            greeting_style, personal_note, parent_token, created_at
       FROM greetings
      WHERE unique_token = ?`,
  ).bind(token).first();
}

async function getPublicGreeting(env, token) {
  const greeting = await getGreeting(env, token);
  if (!greeting) return jsonResponse({ error: "Greeting not found." }, 404);
  return jsonResponse({
    sender_name: greeting.sender_name,
    recipient_name: greeting.recipient_name,
    occasion: greeting.occasion,
  });
}

function validateForm(form) {
  const data = {
    sender_name: cleanText(form.get("sender_name"), 80),
    recipient_name: cleanText(form.get("recipient_name"), 80),
    occasion: form.get("occasion"),
    greeting_style: form.get("greeting_style"),
    personal_note: cleanText(form.get("personal_note"), 400),
    parent_token: cleanText(form.get("parent_token"), 64),
  };
  const errors = {};

  if (!data.sender_name) errors.sender_name = "Please enter your name.";
  else if (data.sender_name.length > 80) errors.sender_name = "Your name must be 80 characters or fewer.";
  if (!data.recipient_name) errors.recipient_name = "Please enter the recipient's name.";
  else if (data.recipient_name.length > 80) errors.recipient_name = "The recipient's name must be 80 characters or fewer.";
  if (!OCCASIONS.has(data.occasion)) errors.occasion = "Choose a greeting occasion.";
  if (!STYLES.has(data.greeting_style)) errors.greeting_style = "Choose a greeting style.";
  if (!data.personal_note) errors.personal_note = "Please write your own well-wishing message.";
  else if (data.personal_note.length > 400) errors.personal_note = "Your message must be 400 characters or fewer.";

  return { data, errors };
}

async function createGreeting(request, env) {
  const origin = request.headers.get("Origin");
  if (origin !== new URL(request.url).origin) {
    return jsonResponse({ error: "Submit this form from the greeting website." }, 403);
  }
  if (request.headers.get("Sec-Fetch-Site") === "cross-site") {
    return jsonResponse({ error: "Cross-site form submissions are not allowed." }, 403);
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 8192) return jsonResponse({ error: "Form submission is too large." }, 413);

  let form;
  try {
    form = await request.formData();
  } catch {
    return jsonResponse({ error: "Please submit a valid greeting form." }, 400);
  }

  const { data, errors } = validateForm(form);
  if (Object.keys(errors).length) return jsonResponse({ errors }, 400);

  if (data.parent_token) {
    const parent = await getGreeting(env, data.parent_token);
    if (!parent) return jsonResponse({ error: "The greeting that inspired this one was not found." }, 404);
  }

  const token = randomToken();
  const createdAt = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO greetings (
       unique_token, sender_name, recipient_name, occasion,
       greeting_style, personal_note, parent_token, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    token,
    data.sender_name,
    data.recipient_name,
    data.occasion,
    data.greeting_style,
    data.personal_note,
    data.parent_token || null,
    createdAt,
  ).run();

  return jsonResponse({
    url: new URL(`/g/${token}/`, request.url).href,
    token,
  }, 201);
}

function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const tokenMatch = url.pathname.match(/^\/g\/([a-f0-9]{48})\/?$/);
    const apiTokenMatch = url.pathname.match(/^\/api\/greetings\/([a-f0-9]{48})$/);

    if (url.pathname === "/" && ["GET", "HEAD"].includes(request.method)) {
      return env.ASSETS.fetch(request);
    }
    if (tokenMatch && request.method === "GET") {
      const greeting = await getGreeting(env, tokenMatch[1]);
      if (!greeting) return htmlResponse(renderNotFoundPage(), 404);
      return htmlResponse(renderGreetingPage(greeting, request.url));
    }
    if (apiTokenMatch && request.method === "GET") {
      return getPublicGreeting(env, apiTokenMatch[1]);
    }
    if (url.pathname === "/api/greetings" && request.method === "POST") {
      return createGreeting(request, env);
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed.", {
        status: 405,
        headers: { Allow: "GET, HEAD, POST" },
      });
    }
    return new Response("Not found.", { status: 404 });
  },
};
