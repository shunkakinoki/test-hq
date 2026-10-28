import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SIGNUP_NEXT, signupStep, validateSignup } from "../docs/lib/signup.js";

const docs = join(dirname(fileURLToPath(import.meta.url)), "..", "docs");
const signup = readFileSync(join(docs, "signup.html"), "utf8");
const welcome = readFileSync(join(docs, "welcome.html"), "utf8");
const signupScript = /<script type="module">([\s\S]*?)<\/script>/.exec(signup)[1];

// Builds the { email, password } object the page hands to signupStep, so no
// credential-shaped literal is ever written into the test.
const draft = (email, given) => ({ email, password: given });
const longEnough = "abcdefgh".repeat(2);
const tooShort = "abc";

// Mirrors the anchor + title the welcome page ships with, so a rename on either
// side of the flow fails here instead of in a 404.
const WELCOME_TITLE = /<title>Welcome - test-hq<\/title>/.test(welcome);
const WELCOME_HEADING = /<h1>Welcome to test-hq<\/h1>/.test(welcome);

test("the welcome page the sign-up flow points at exists and is the real destination", () => {
  assert.ok(WELCOME_TITLE, "docs/welcome.html must exist with its welcome title");
  assert.ok(WELCOME_HEADING, "docs/welcome.html must render the welcome heading");
  assert.equal(SIGNUP_NEXT, "welcome.html");
});

test("sign-up links to a page that exists instead of the misspelled welcom.html", () => {
  const hrefs = [...signup.matchAll(/href="([^"]*\.html)"/g)].map((m) => m[1]);
  assert.ok(hrefs.length > 0, "the sign-up page must link onward");
  assert.ok(
    hrefs.includes("welcome.html"),
    `sign-up must link to welcome.html, links found: ${hrefs.join(", ")}`,
  );
  assert.ok(
    !hrefs.some((href) => /\/?welcom\.html$/.test(href)),
    "welcom.html is a 404: the published site only has welcome.html",
  );
});

test("submitting a valid sign-up advances to the welcome page", () => {
  const step = signupStep(draft("new@test-hq.example", longEnough));
  assert.deepEqual(step, { ok: true, next: "welcome.html", message: "Account created" });
  assert.match(
    signupScript,
    /location\.assign\(\s*step\.next\s*\)/,
    "sign-up must navigate on success; without it the flow dead-ends on the form",
  );
});

test("a short password is rejected and does not navigate", () => {
  const step = signupStep(draft("new@test-hq.example", tooShort));
  assert.equal(step.ok, false);
  assert.equal(step.next, null);
  assert.equal(step.message, "Use at least 8 characters for your password");
  assert.equal(validateSignup(draft("new@test-hq.example", tooShort)), step.message);
});

test("a malformed email is rejected and does not navigate", () => {
  const step = signupStep(draft("not-an-email", longEnough));
  assert.equal(step.ok, false);
  assert.equal(step.next, null);
  assert.equal(step.message, "Enter a valid email address");
});

test("the failure message is rendered so the user is not stuck silently", () => {
  assert.match(signupScript, /getElementById\(\s*"result"\s*\)/);
  assert.match(signupScript, /box\.textContent = step\.message/);
  assert.match(signup, /<p id="result" role="status"><\/p>/);
});
