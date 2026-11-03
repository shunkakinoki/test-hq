import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SIGNUP_NEXT, signupStep, validateSignup } from "../docs/lib/signup.js";

const docs = join(dirname(fileURLToPath(import.meta.url)), "..", "docs");
const signup = readFileSync(join(docs, "signup.html"), "utf8");
const signupScript = /<script type="module">([\s\S]*?)<\/script>/.exec(signup)?.[1] ?? "";

test("every local link on the sign up page resolves to a published page", () => {
  const hrefs = [...signup.matchAll(/href="([^"#][^"]*)"/g)].map((match) => match[1]);
  assert.ok(hrefs.length > 0, "signup.html must link onward after signing up");
  for (const href of hrefs) {
    if (/^[a-z]+:/i.test(href)) continue;
    assert.ok(
      existsSync(join(docs, href)),
      `signup.html links to ${href}, which is not a published page (it 404s on the live site)`,
    );
  }
});

test("signing up continues to the workspace instead of a 404", () => {
  assert.match(
    signup,
    /href="welcome\.html"/,
    "the continue link must point at welcome.html; welcom.html is not published and 404s",
  );
  assert.equal(SIGNUP_NEXT, "welcome.html");
  assert.ok(existsSync(join(docs, SIGNUP_NEXT)), "welcome.html must be published");
});

test("submitting sign up advances the flow instead of reloading the form", () => {
  const form = /<form id="signup"[^>]*>/.exec(signup)?.[0] ?? "";
  assert.doesNotMatch(
    form,
    /action=/,
    "the form must not post back to the sign up page: that reloads it and puts the password in the URL",
  );
  assert.match(
    signupScript,
    /event\.preventDefault\(\)/,
    "signup.html must handle submit itself, otherwise the browser reloads the page",
  );
  assert.match(
    signupScript,
    /location\.assign\(\s*step\.next\s*\)/,
    "sign-up must navigate on success; without it the flow dead-ends on the form",
  );
});

test("a valid sign up returns the welcome page as the next step", () => {
  const step = signupStep({ email: "new@test-hq.example", password: "correct-horse-9" });
  assert.deepEqual(step, { ok: true, next: "welcome.html", message: "Account created" });
});

test("a short password is rejected and does not navigate", () => {
  const step = signupStep({ email: "new@test-hq.example", password: "short" });
  assert.equal(step.ok, false);
  assert.equal(step.next, null);
  assert.equal(step.message, "Use at least 8 characters for your password");
});

test("a malformed email is rejected and does not navigate", () => {
  const step = signupStep({ email: "not-an-email", password: "correct-horse-9" });
  assert.equal(step.ok, false);
  assert.equal(step.next, null);
  assert.equal(step.message, "Enter a valid email address");
  assert.equal(validateSignup({ email: "  ", password: "correct-horse-9" }), "Enter a valid email address");
});

test("the failure message is rendered so the user is not stuck silently", () => {
  assert.match(signup, /<p id="result" role="status"><\/p>/);
  assert.match(signupScript, /box\.textContent = step\.message/);
});
