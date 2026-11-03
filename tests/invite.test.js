import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sendInvite, validateInvite } from "../docs/lib/invite.js";
import { INVITES_ENDPOINT } from "../docs/lib/invite-config.js";

const docs = join(dirname(fileURLToPath(import.meta.url)), "..", "docs");
const invite = readFileSync(join(docs, "invite.html"), "utf8");
const inviteScript = /<script type="module">([\s\S]*?)<\/script>/.exec(invite)[1];
const members = ["owner@test-hq.example"];

test("accepts a new teammate", () => {
  assert.equal(validateInvite("new@test-hq.example", []), null);
});

test("rejects a malformed email", () => {
  assert.equal(validateInvite("not-an-email", []), "Enter a valid email address");
});

test("rejects an existing member", () => {
  assert.equal(validateInvite("Owner@test-hq.example", members), "Already a member");
});

test("the invite page no longer reports a send that never happened", () => {
  assert.doesNotMatch(
    inviteScript,
    /problem\s*\?\?\s*`Invite sent to/,
    "invite.html must not fall back to a success message: validateInvite never sends anything",
  );
  assert.match(inviteScript, /await sendInvite\(/);
  assert.match(inviteScript, /box\.dataset\.state = ok \? "sent" : "failed"/);
});

test("with no delivery endpoint configured, a valid invite reports failure", async () => {
  const result = await sendInvite("new@test-hq.example", members, null);
  assert.equal(result.ok, false);
  assert.equal(
    result.message,
    "Invites are not available yet, so new@test-hq.example was not invited",
  );
});

test("the shipped configuration has no endpoint, so the page cannot claim success", async () => {
  assert.equal(INVITES_ENDPOINT, null);
  const result = await sendInvite("new@test-hq.example", members);
  assert.equal(result.ok, false);
});

test("a configured endpoint that accepts the invite reports success", async () => {
  const calls = [];
  const fakeFetch = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, status: 202 };
  };
  const result = await sendInvite("New@Test-HQ.example", members, "/api/invites", fakeFetch);
  assert.deepEqual(result, { ok: true, message: "Invite sent to new@test-hq.example" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/invites");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].init.body), { email: "new@test-hq.example" });
});

test("a rejecting endpoint never reports success", async () => {
  const result = await sendInvite(
    "new@test-hq.example",
    members,
    "/api/invites",
    async () => ({ ok: false, status: 500 }),
  );
  assert.equal(result.ok, false);
  assert.equal(result.message, "The invite service rejected the invite for new@test-hq.example");
});

test("an unreachable endpoint never reports success", async () => {
  const result = await sendInvite("new@test-hq.example", members, "/api/invites", async () => {
    throw new TypeError("Failed to fetch");
  });
  assert.equal(result.ok, false);
  assert.match(result.message, /could not be reached/);
});

test("validation failures are returned before any request is attempted", async () => {
  let called = false;
  const fakeFetch = async () => {
    called = true;
    return { ok: true };
  };
  const existing = await sendInvite("Owner@test-hq.example", members, "/api/invites", fakeFetch);
  assert.deepEqual(existing, { ok: false, message: "Already a member" });
  const malformed = await sendInvite("nope", members, "/api/invites", fakeFetch);
  assert.equal(malformed.ok, false);
  assert.equal(called, false);
});
