import assert from "node:assert/strict";
import test from "node:test";

import worker from "../src/index.js";

class MemoryDatabase {
  greetings = new Map();

  prepare(query) {
    return {
      bind: (...values) => ({
        first: async () => this.greetings.get(values[0]) || null,
        run: async () => {
          if (query.includes("INSERT INTO greetings")) {
            const [
              uniqueToken,
              senderName,
              recipientName,
              occasion,
              greetingStyle,
              personalNote,
              parentToken,
              createdAt,
            ] = values;
            this.greetings.set(uniqueToken, {
              unique_token: uniqueToken,
              sender_name: senderName,
              recipient_name: recipientName,
              occasion,
              greeting_style: greetingStyle,
              personal_note: personalNote,
              parent_token: parentToken,
              created_at: createdAt,
            });
          }
          return { success: true };
        },
      }),
    };
  }
}

function makeEnv() {
  return {
    DB: new MemoryDatabase(),
    ASSETS: {
      fetch: async () => new Response("<h1>home</h1>", {
        headers: { "Content-Type": "text/html" },
      }),
    },
  };
}

function greetingForm(overrides = {}) {
  const form = new FormData();
  const fields = {
    sender_name: "Alice",
    recipient_name: "Bea",
    occasion: "christmas",
    greeting_style: "heartwarming",
    personal_note: "Wishing you a bright Christmas!",
    parent_token: "",
    ...overrides,
  };
  for (const [name, value] of Object.entries(fields)) form.set(name, value);
  return form;
}

function postGreeting(form, origin = "https://wishes.example") {
  return new Request("https://wishes.example/api/greetings", {
    method: "POST",
    headers: {
      Origin: origin,
      "Sec-Fetch-Site": "same-origin",
    },
    body: form,
  });
}

async function createGreeting(env, fields) {
  const response = await worker.fetch(postGreeting(greetingForm(fields)), env);
  assert.equal(response.status, 201);
  return response.json();
}

test("homepage is served from static assets", async () => {
  const env = makeEnv();
  const response = await worker.fetch(new Request("https://wishes.example/"), env);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /home/);
});

test("creates separate greetings and links each new greeting to its parent", async () => {
  const env = makeEnv();
  const parent = await createGreeting(env, { sender_name: "Alice" });
  const child = await createGreeting(env, {
    sender_name: "Bea",
    parent_token: parent.token,
  });

  assert.notEqual(parent.token, child.token);
  assert.equal(env.DB.greetings.get(child.token).parent_token, parent.token);

  const parentPage = await worker.fetch(
    new Request(parent.url),
    env,
  );
  const childPage = await worker.fetch(
    new Request(child.url),
    env,
  );
  const parentHtml = await parentPage.text();
  const childHtml = await childPage.text();

  assert.equal(parentPage.status, 200);
  assert.equal(childPage.status, 200);
  assert.match(parentHtml, /Alice/);
  assert.match(parentHtml, /property="og:title"/);
  assert.match(parentHtml, /twitter:card/);
  assert.match(parentHtml, /https:\/\/wishes\.example\/festive\/images\/social-card\.png/);
  assert.match(childHtml, /Bea/);
  assert.match(childHtml, new RegExp(`from=${child.token}#create`));
  assert.match(childHtml, /data-share-url="https:\/\/wishes\.example\/g\//);
});

test("escapes user text in rendered HTML and social metadata", async () => {
  const env = makeEnv();
  const created = await createGreeting(env, {
    sender_name: '<img src=x onerror="alert(1)">',
    recipient_name: "Friend",
    personal_note: "<script>alert(1)</script>",
  });
  const response = await worker.fetch(new Request(created.url), env);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.doesNotMatch(html, /<img src=x onerror=/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test("rejects invalid input, cross-origin submissions, and unknown greeting links", async () => {
  const env = makeEnv();
  const invalid = await worker.fetch(
    postGreeting(greetingForm({ recipient_name: " ", occasion: "unknown" })),
    env,
  );
  assert.equal(invalid.status, 400);
  assert.deepEqual((await invalid.json()).errors, {
    recipient_name: "Please enter the recipient's name.",
    occasion: "Choose a greeting occasion.",
  });

  const crossOrigin = await worker.fetch(
    postGreeting(greetingForm(), "https://attacker.example"),
    env,
  );
  assert.equal(crossOrigin.status, 403);

  const unknown = await worker.fetch(
    new Request(`https://wishes.example/g/${"a".repeat(48)}/`),
    env,
  );
  assert.equal(unknown.status, 404);
});

test("does not allow a child greeting with an unknown parent", async () => {
  const env = makeEnv();
  const response = await worker.fetch(
    postGreeting(greetingForm({ parent_token: "f".repeat(48) })),
    env,
  );
  assert.equal(response.status, 404);
  assert.equal(env.DB.greetings.size, 0);
});
