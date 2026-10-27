import assert from "node:assert/strict";
import { test } from "node:test";
import { cartTotal, subtotal } from "../docs/lib/cart.js";

const items = [
  { name: "Team plan", cents: 10000, quantity: 1 },
  { name: "Extra seat", cents: 1500, quantity: 2 },
];

test("subtotal sums every line", () => {
  assert.equal(subtotal(items), 13000);
});

test("applies a percentage discount code", () => {
  assert.equal(cartTotal(items, "save10"), 11700);
});

test("ignores an unknown code", () => {
  assert.equal(cartTotal(items, "BOGUS"), 13000);
});
