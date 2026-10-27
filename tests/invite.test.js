import assert from "node:assert/strict";
import { test } from "node:test";
import { validateInvite } from "../docs/lib/invite.js";

test("accepts a new teammate", () => {
  assert.equal(validateInvite("new@test-hq.example", []), null);
});

test("rejects a malformed email", () => {
  assert.equal(validateInvite("not-an-email", []), "Enter a valid email address");
});

test("rejects an existing member", () => {
  assert.equal(validateInvite("Owner@test-hq.example", ["owner@test-hq.example"]), "Already a member");
});
