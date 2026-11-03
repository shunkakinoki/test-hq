import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { dropDomain, validateInvite } from "../docs/lib/invite.js";
import { INVITE_ENDPOINT, sendInvite } from "../docs/lib/invite-api.js";

const docs = new URL("../docs/", import.meta.url);
const inviteHtml = fs.readFileSync(new URL("invite.html", docs), "utf8");

const fakeFetch = (response) => {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init });
    return response;
  };
  return { calls, impl };
};

test("sending an invite actually posts to the invite endpoint", async () => {
  const { calls, impl } = fakeFetch({ ok: true, status: 201, json: async () => ({ id: "inv_1" }) });
  const body = await sendInvite("  New-Teammate@Test-HQ.example ", { fetchImpl: impl });

  assert.equal(calls.length, 1, "an invite must leave the page as a request");
  assert.equal(calls[0].url, INVITE_ENDPOINT);
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers["content-type"], "application/json");
  assert.deepEqual(JSON.parse(calls[0].init.body), { email: "new-teammate@test-hq.example" });
  assert.deepEqual(body, { id: "inv_1" });
});

test("a failed invite is reported, never swallowed", async () => {
  const { impl } = fakeFetch({ ok: false, status: 500, json: async () => ({}) });
  await assert.rejects(() => sendInvite("qa@test-hq.example", { fetchImpl: impl }), /HTTP 500/);
});

test("a network error propagates so the page can say the invite did not go out", async () => {
  const impl = async () => {
    throw new Error("network down");
  };
  await assert.rejects(() => sendInvite("qa@test-hq.example", { fetchImpl: impl }), /network down/);
});

test("the page only claims success after the request resolves", () => {
  assert.match(inviteHtml, /import \{ sendInvite \}/, "the page must use the real send path");
  assert.match(inviteHtml, /await sendInvite\(/, "success text must follow an awaited request");
  assert.match(inviteHtml, /catch/, "a failed send must be surfaced to the teammate");
  assert.doesNotMatch(
    inviteHtml,
    /problem \?\? `Invite sent to/,
    "writing the success text without sending is the bug this test exists for",
  );
});

test("validateInvite still rejects bad and duplicate addresses", () => {
  assert.equal(validateInvite("new@test-hq.example", []), null);
  assert.equal(validateInvite("not-an-email", []), "Enter a valid email address");
  assert.equal(validateInvite("Owner@test-hq.example", ["owner@test-hq.example"]), "Already a member");
  assert.equal(validateInvite("qa@test-hq.example", null), null);
});

test("dropDomain reads the domain after the last @", () => {
  assert.equal(dropDomain("qa@test-hq.example"), "test-hq.example");
  assert.equal(dropDomain(" QA@Test-HQ.example "), "test-hq.example");
  assert.equal(dropDomain("no-at-sign"), null);
});
