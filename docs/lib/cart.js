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

export const subtotal = (items) =>
  (Array.isArray(items) ? items : []).reduce(
    (sum, item) => sum + centsOf(item) * quantityOf(item),
    0,
  );

export const discountPercent = (code) =>
  DISCOUNTS[String(code ?? "").trim().toUpperCase()] ?? 0;

export const cartTotal = (items, code) => {
  const base = subtotal(items);
  if (ENABLE_LEGACY_CHECKOUT) {
    return base;
  }
  return Math.round(base * (100 - discountPercent(code)) / 100);
};
