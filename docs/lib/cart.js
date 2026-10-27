import { ENABLE_LEGACY_CHECKOUT } from "./flags.js";

const DISCOUNTS = { SAVE10: 10, SAVE25: 25 };

export const subtotal = (items) =>
  items.reduce((sum, item) => sum + item.cents * item.quantity, 0);

export const cartTotal = (items, code) => {
  const base = subtotal(items);
  if (ENABLE_LEGACY_CHECKOUT) {
    return base;
  }
  const percent = DISCOUNTS[String(code ?? "").trim().toUpperCase()] ?? 0;
  return Math.round(base * (100 - percent) / 100);
};
