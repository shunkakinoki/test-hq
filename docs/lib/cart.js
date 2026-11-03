import { ENABLE_LEGACY_CHECKOUT } from "./flags.js";

const DISCOUNTS = { SAVE10: 10, SAVE25: 25 };

const lineCents = (item) => {
  const cents = Number(item?.cents);
  const quantity = Number(item?.quantity ?? 1);
  if (!Number.isFinite(cents) || !Number.isFinite(quantity) || quantity <= 0) return 0;
  return Math.round(cents * quantity);
};

export const subtotal = (items) =>
  (Array.isArray(items) ? items : []).reduce((sum, item) => sum + lineCents(item), 0);

export const discountPercent = (code) => {
  if (ENABLE_LEGACY_CHECKOUT) return 0;
  return DISCOUNTS[String(code ?? "").trim().toUpperCase()] ?? 0;
};

export const cartTotal = (items, code) => {
  const base = subtotal(items);
  const percent = discountPercent(code);
  return Math.round((base * (100 - percent)) / 100);
};
