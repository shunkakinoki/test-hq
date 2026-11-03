import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { submitInvite, validateInvite } from "../docs/lib/invite.js";

const docs = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "docs");
const invitePage = fs.readFileSync(path.join(docs, "invite.html"), "utf8");

test("accepts a new teammate", () => {
  assert.equal(validateInvite("new@test-hq.example", []), null);
});

test("rejects a malformed email", () => {
  assert.equal(validateInvite("not-an-email", []), "Enter a valid email address");
});

test("rejects an existing member", () => {
  assert.equal(validateInvite("Owner@test-hq.example", ["owner@test-hq.example"]), "Already a member");
});

test("duplicate detection normalises casing and padding", () => {
  assert.equal(validateInvite("  OWNER@test-hq.example  ", ["owner@test-hq.example"]), "Already a member");
  assert.equal(validateInvite("owner@test-hq.example", ["  Owner@Test-HQ.example "]), "Already a member");
});

test("a blank email is rejected", () => {
  assert.equal(validateInvite("", []), "Enter a valid email address");
  assert.equal(validateInvite(undefined, []), "Enter a valid email address");
});

test("validation success alone never claims the invite was sent", async () => {
  const outcome = await submitInvite("teammate@test-hq.example", [], undefined);
  assert.equal(outcome.sent, false);
  assert.doesNotMatch(outcome.message, /^Invite sent/);
  assert.match(outcome.message, /not available yet/);
});

test("a real transport reports success only after it resolves", async () => {
  const calls = [];
  const outcome = await submitInvite("Teammate@Test-HQ.example", [], async (email) => {
    calls.push(email);
  });
  assert.deepEqual(calls, ["teammate@test-hq.example"]);
  assert.equal(outcome.sent, true);
  assert.equal(outcome.message, "Invite sent to teammate@test-hq.example");
});

test("a failing transport is reported as a failure, not a success", async () => {
  const outcome = await submitInvite("teammate@test-hq.example", [], async () => {
    throw new Error("network down");
  });
  assert.equal(outcome.sent, false);
  assert.match(outcome.message, /Could not send the invite/);
  assert.match(outcome.message, /network down/);
});

test("the invite page does not claim success from validation alone", () => {
  assert.doesNotMatch(
    invitePage,
    /problem \?\? `Invite sent/,
    "the page used to print 'Invite sent to <email>' whenever validation passed",
  );
  assert.match(invitePage, /submitInvite\(/);
  assert.match(invitePage, /outcome\.sent/);
});
