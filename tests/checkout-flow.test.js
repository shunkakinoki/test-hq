import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cartTotal, discountPercent, subtotal } from "../docs/lib/cart.js";
import { formatCents } from "../docs/lib/format.js";

const docs = join(dirname(fileURLToPath(import.meta.url)), "..", "docs");
const checkout = readFileSync(join(docs, "checkout.html"), "utf8");
const checkoutScript = /<script type="module">([\s\S]*?)<\/script>/.exec(checkout)[1];

const items = [{ name: "Team plan (5 seats)", cents: 10000, quantity: 1 }];

test("the total is shown on arrival, before the buyer submits anything", () => {
  assert.match(
    checkoutScript,
    /render\(\s*""\s*\)/,
    "checkout.html must render a total on load; otherwise the buyer sees a blank total",
  );
  assert.match(checkoutScript, /Total: \$\{formatCents\(cartTotal\(/);
});

test("the checkout page forwards the entered discount code to cartTotal", () => {
  assert.match(
    checkoutScript,
    /cartTotal\(\s*items\s*,\s*code\s*\)/,
    "checkout.html must pass the submitted discount code; dropping it makes every code a no-op",
  );
  assert.match(checkoutScript, /get\(\s*"code"\s*\)/);
});

test("the line price shown on the checkout page is derived from the cart data", () => {
  assert.match(
    checkoutScript,
    /formatCents\(\s*item\.cents\s*\*\s*item\.quantity\s*\)/,
    "the rendered row price must be computed from the same item data the total uses",
  );
  assert.doesNotMatch(
    checkout,
    /\$100\.00/,
    "the row price must not be hardcoded where it can drift from the cart total",
  );
  assert.equal(formatCents(items[0].cents * items[0].quantity), "$100.00");
});

test("the row label and the priced item describe the same product", () => {
  const label = /name:\s*"([^"]+)"/.exec(checkoutScript)[1];
  assert.equal(label, items[0].name);
  assert.match(label, /5 seats/);
});

test("the total the checkout page renders honours the discount", () => {
  assert.equal(formatCents(cartTotal(items, "SAVE10")), "$90.00");
  assert.equal(cartTotal(items, "SAVE10"), 9000);
  assert.equal(subtotal(items), 10000);
});

test("discount codes are matched case-insensitively and trimmed", () => {
  assert.equal(discountPercent(" save10 "), 10);
  assert.equal(discountPercent("SAVE25"), 25);
});

test("an unknown or missing code does not change the total", () => {
  assert.equal(cartTotal(items, "NOPE"), 10000);
  assert.equal(cartTotal(items, undefined), 10000);
});

test("a malformed line cannot corrupt the total with a non-numeric quantity", () => {
  assert.equal(subtotal([{ cents: 10000, quantity: undefined }]), 0);
  assert.equal(subtotal([{ cents: 10000, quantity: "2" }]), 20000);
  assert.equal(subtotal(undefined), 0);
});
