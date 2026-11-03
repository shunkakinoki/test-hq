import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { cartLines, cartTotal, lineTotal, subtotal } from "../docs/lib/cart.js";
import { formatCents } from "../docs/lib/format.js";

const docs = new URL("../docs/", import.meta.url);
const checkoutHtml = fs.readFileSync(new URL("checkout.html", docs), "utf8");

// The exact items the checkout page ships with.
const pageItems = [{ name: "Team plan", seats: 5, cents: 10000, quantity: 1 }];

test("the cart row is rendered from the item data, not hardcoded in the HTML", () => {
  assert.match(checkoutHtml, /id="cart-lines"/, "the cart body must be a mount point the page fills in");
  assert.match(checkoutHtml, /cartLines\(/, "the page must render its rows from the cart items");
  assert.doesNotMatch(
    checkoutHtml,
    /<td>\s*Team plan/,
    "a hardcoded row drifts from the priced items and cannot be trusted",
  );
});

test("the total is shown before the shopper presses Pay", () => {
  assert.match(checkoutHtml, /renderTotal\(""\)/, "the page must price the order on load");
});

test("the row a shopper reads matches the amount they are charged", () => {
  const [line] = cartLines(pageItems, formatCents);
  assert.equal(line.label, "Team plan (5 seats)");
  assert.equal(line.total, "$100.00");
  assert.equal(formatCents(cartTotal(pageItems, "")), line.total);
});

test("a quantity above one is priced per unit, not once", () => {
  const items = [{ name: "Extra seat", cents: 1500, quantity: 2 }];
  assert.equal(lineTotal(items[0]), 3000);
  assert.equal(cartLines(items, formatCents)[0].total, "$30.00");
  assert.equal(formatCents(cartTotal(items, "")), "$30.00");
});

test("the discount code applies to the same base the rows show", () => {
  const [line] = cartLines(pageItems, formatCents);
  assert.equal(line.total, "$100.00");
  assert.equal(formatCents(cartTotal(pageItems, "save10")), "$90.00");
  assert.equal(formatCents(cartTotal(pageItems, "SAVE25")), "$75.00");
  assert.equal(formatCents(cartTotal(pageItems, "BOGUS")), line.total);
});

test("a malformed item cannot produce NaN in the cart", () => {
  assert.equal(subtotal([{ cents: "abc", quantity: 1 }]), 0);
  assert.equal(subtotal([{ cents: 1000 }]), 0);
  assert.equal(subtotal(null), 0);
  assert.equal(formatCents(cartTotal([{ cents: 1000, quantity: 1 }], "")), "$10.00");
});
