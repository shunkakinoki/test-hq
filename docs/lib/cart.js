import { ENABLE_LEGACY_CHECKOUT } from "./flags.js";

const DISCOUNTS = { SAVE10: 10, SAVE25: 25 };

const centsOf = (item) => {
  const cents = Number(item?.cents ?? 0);
  return Number.isFinite(cents) ? cents : 0;
};

const quantityOf = (item) => {
  const quantity = Number(item?.quantity ?? 0);
  return Number.isFinite(quantity) ? quantity : 0;
};

export const lineTotal = (item) => centsOf(item) * quantityOf(item);

export const lineLabel = (item) => {
  const seats = Number(item?.seats ?? 0);
  const name = String(item?.name ?? "");
  return Number.isFinite(seats) && seats > 0 ? `${name} (${seats} seats)` : name;
};

// The single source of truth for what the cart shows: the page renders these
// lines and prices the order from the same items, so the row a shopper reads
// and the amount they are charged cannot drift apart.
export const cartLines = (items, format = (cents) => String(cents)) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    label: lineLabel(item),
    quantity: quantityOf(item),
    unitPrice: format(centsOf(item)),
    total: format(lineTotal(item)),
  }));

export const subtotal = (items) =>
  (Array.isArray(items) ? items : []).reduce((sum, item) => sum + lineTotal(item), 0);

export const discountPercent = (code) => DISCOUNTS[String(code ?? "").trim().toUpperCase()] ?? 0;

export const cartTotal = (items, code) => {
  const base = subtotal(items);
  if (ENABLE_LEGACY_CHECKOUT) {
    return base;
  }
  return Math.round((base * (100 - discountPercent(code))) / 100);
};
