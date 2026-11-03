import assert from "node:assert/strict";
import { test } from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MIN_PASSWORD_LENGTH, SIGNUP_NEXT, signupStep, validateSignup } from "../docs/lib/signup.js";

const docs = join(dirname(fileURLToPath(import.meta.url)), "..", "docs");
const pages = readdirSync(docs).filter((name) => name.endsWith(".html"));
const read = (name) => readFileSync(join(docs, name), "utf8");

const signup = read("signup.html");
const welcome = read("welcome.html");
const signupScript = /<script type="module">([\s\S]*?)<\/script>/.exec(signup)[1];

// Fixtures are built, not typed, so the length of each one is visible here.
const OK_PASSWORD = "p".repeat(MIN_PASSWORD_LENGTH + 4);
const SHORT_PASSWORD = "p".repeat(MIN_PASSWORD_LENGTH - 1);

// The regression that shipped: signup.html pointed at `welcom.html`, which the
// published site does not contain, so the flow dead-ended on a 404.
test("every internal link on a published page resolves to a page that exists", () => {
  const missing = [];
  for (const page of pages) {
    for (const [, href] of read(page).matchAll(/href="([^"#:][^"]*)"/g)) {
      if (!href.endsWith(".html")) continue;
      if (!pages.includes(href.replace(/^\.\//, ""))) missing.push(`${page} -> ${href}`);
    }
  }
  assert.deepEqual(missing, [], `links to pages that do not exist: ${missing.join(", ")}`);
});

test("sign-up sends the new account to the welcome page it actually ships", () => {
  assert.equal(SIGNUP_NEXT, "welcome.html");
  assert.ok(pages.includes(SIGNUP_NEXT), "docs/welcome.html must exist");
  assert.match(welcome, /<h1>Welcome to test-hq<\/h1>/);
  assert.match(signup, /<a id="continue" href="welcome\.html">/);
  assert.doesNotMatch(signup, /welcom\.html/);
});

test("submitting valid details advances out of the form", () => {
  assert.deepEqual(signupStep({ email: "new@example.com", password: OK_PASSWORD }), {
    ok: true,
    next: "welcome.html",
    message: "Account created",
  });
  assert.match(
    signupScript,
    /location\.assign\(\s*step\.next\s*\)/,
    "sign-up must navigate on success; without it the flow dead-ends on the form",
  );
});

test("the form never submits the password as a query parameter", () => {
  assert.match(signupScript, /event\.preventDefault\(\)/);
  assert.doesNotMatch(signup, /<form id="signup"[^>]*\saction=/, "the form must not post the password to a URL");
});

test("a short password is rejected and does not navigate", () => {
  const step = signupStep({ email: "new@example.com", password: SHORT_PASSWORD });
  assert.equal(step.ok, false);
  assert.equal(step.next, null);
  assert.equal(step.message, `Use at least ${MIN_PASSWORD_LENGTH} characters for your password`);
});

test("a malformed email is rejected and does not navigate", () => {
  const step = signupStep({ email: "not-an-email", password: OK_PASSWORD });
  assert.equal(step.ok, false);
  assert.equal(step.next, null);
  assert.equal(step.message, "Enter a valid email address");
  assert.equal(validateSignup({ email: "  new@example.com  ", password: OK_PASSWORD }), null);
});

test("the rejection is rendered so the user is not left on a silent form", () => {
  assert.match(signup, /<p id="result" role="status"><\/p>/);
  assert.match(signupScript, /box\.textContent = step\.message/);
});
