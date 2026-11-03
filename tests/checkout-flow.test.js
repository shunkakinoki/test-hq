import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { cartTotal, discountPercent, subtotal } from "../docs/lib/cart.js";

const docs = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "docs");
const checkout = fs.readFileSync(path.join(docs, "checkout.html"), "utf8");

const items = [{ name: "Team plan (5 seats)", cents: 10000, quantity: 1 }];

test("the cart table has no hardcoded price", () => {
  const table = checkout.match(/<table id="cart">([\s\S]*?)<\/table>/);
  assert.ok(table, "checkout.html must keep a #cart table");
  assert.equal(
    /\$\s?\d/.test(table[1]),
    false,
    "a price typed into the markup drifts from the item data that is actually charged",
  );
});

test("the cart row is rendered from the same item data that is charged", () => {
  assert.match(checkout, /id="cart-lines"/);
  assert.match(checkout, /items\.map\(/);
  assert.match(checkout, /formatCents\(item\.cents \* item\.quantity\)/);
  assert.match(checkout, /name: "Team plan \(5 seats\)", cents: 10000, quantity: 1/);
});

test("the total is rendered on load, before any submit", () => {
  assert.match(checkout, /renderTotal\(""\);/);
  assert.match(checkout, /Total: \$\{formatCents\(cartTotal\(items, code\)\)\}/);
});

test("a valid code lowers the total", () => {
  assert.equal(cartTotal(items, "SAVE10"), 9000);
  assert.equal(cartTotal(items, " save25 "), 7500);
});

test("an unknown code does not change the total and is reported", () => {
  assert.equal(cartTotal(items, "BOGUS"), 10000);
  assert.equal(discountPercent("BOGUS"), 0);
  assert.match(checkout, /is not valid/);
});

test("a malformed line cannot corrupt the total", () => {
  assert.equal(subtotal([{ cents: "abc", quantity: 1 }]), 0);
  assert.equal(subtotal([{ cents: 10000, quantity: 0 }]), 0);
  assert.equal(subtotal([null, { cents: 10000, quantity: 1 }]), 10000);
  assert.equal(subtotal(undefined), 0);
});
