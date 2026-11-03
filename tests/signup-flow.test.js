import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { signupDestination, validateSignup } from "../docs/lib/signup.js";

const docs = new URL("../docs/", import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, docs), "utf8");
const pages = fs.readdirSync(docs).filter((file) => file.endsWith(".html"));

test("every link in the published pages resolves to a published file", () => {
  const missing = [];
  for (const page of pages) {
    for (const [, target] of read(page).matchAll(/href="([^"#?]+)"/g)) {
      if (/^[a-z]+:/i.test(target) || target.startsWith("//")) continue;
      if (!fs.existsSync(new URL(target, docs))) missing.push(`${page} -> ${target}`);
    }
  }
  assert.deepEqual(missing, [], `links point at files the site does not publish: ${missing.join(", ")}`);
});

test("the sign up continue link goes to the welcome page", () => {
  const href = read("signup.html").match(/id="continue"[^>]*href="([^"]+)"/)?.[1];
  assert.equal(href, "welcome.html");
  assert.ok(fs.existsSync(new URL(href, docs)), `${href} is not published`);
});

test("signing up never submits credentials in the URL", () => {
  const html = read("signup.html");
  const form = html.match(/<form[^>]*>/)?.[0] ?? "";
  assert.doesNotMatch(form, /method=["']?get/i, "a GET form writes the password into the URL and history");
  assert.match(html, /addEventListener\("submit"/, "the page must handle its own submit");
  assert.match(html, /preventDefault\(\)/, "the native submit must be cancelled");
});

test("a valid sign up continues to a page that exists", () => {
  const html = read("signup.html");
  assert.match(html, /signupDestination\(/, "the redirect target must come from one shared helper");
  const next = signupDestination({ dataset: { next: "welcome.html" } });
  assert.ok(fs.existsSync(new URL(next, docs)), `sign up redirects to ${next}, which is not published`);
});

test("validateSignup rejects a malformed email and a short password", () => {
  assert.equal(validateSignup("not-an-email", "longenough"), "Enter a valid email address");
  assert.equal(validateSignup("qa@test-hq.example", "short"), "Use at least 8 characters for your password");
  assert.equal(validateSignup("qa@test-hq.example", "longenough"), null);
});

test("signupDestination falls back to the welcome page", () => {
  assert.equal(signupDestination({ dataset: { next: " welcome.html " } }), "welcome.html");
  assert.equal(signupDestination({ dataset: {} }), "welcome.html");
  assert.equal(signupDestination(), "welcome.html");
});
