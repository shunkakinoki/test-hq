import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { signupNextStep } from "../docs/lib/signup.js";

const docs = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "docs");
const read = (file) => fs.readFileSync(path.join(docs, file), "utf8");

test("every local link on a published page resolves to a published file", () => {
  const pages = fs.readdirSync(docs).filter((file) => file.endsWith(".html"));
  assert.ok(pages.length > 0);
  const broken = [];
  for (const page of pages) {
    for (const [, href] of read(page).matchAll(/href="([^"]+)"/g)) {
      if (/^(https?:|mailto:|#)/.test(href)) continue;
      const target = path.join(docs, href.split("#")[0]);
      if (!fs.existsSync(target)) broken.push(`${page} -> ${href}`);
    }
  }
  assert.deepEqual(broken, [], "these links 404 on the published site");
});

test("the sign up form never submits credentials in the URL", () => {
  const html = read("signup.html");
  assert.equal(
    /<form[^>]*\baction=/i.test(html),
    false,
    "a form action without a method makes the browser GET the password into the query string",
  );
  assert.match(html, /addEventListener\("submit"/);
  assert.match(html, /preventDefault\(\)/);
});

test("sign up continues to a welcome page that exists", () => {
  const result = signupNextStep("new.user@test-hq.example", "hunter2hunter2");
  assert.equal(result.ok, true);
  assert.equal(result.next, "welcome.html");
  assert.ok(fs.existsSync(path.join(docs, result.next)), `${result.next} must be published`);
  assert.match(read("signup.html"), /href="welcome\.html"/);
});

test("sign up rejects a malformed email", () => {
  const result = signupNextStep("not-an-email", "hunter2hunter2");
  assert.equal(result.ok, false);
  assert.equal(result.next, null);
  assert.equal(result.error, "Enter a valid email address");
});

test("sign up rejects a short password", () => {
  const result = signupNextStep("new.user@test-hq.example", "short");
  assert.equal(result.ok, false);
  assert.match(result.error, /at least 8 characters/);
});
