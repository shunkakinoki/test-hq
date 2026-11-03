const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (email) => String(email ?? "").trim().toLowerCase();

// Split on the last "@" so a quoted local part such as "a@b"@example.com still
// yields the real domain. The old code took everything after the first "@",
// which returned null for an address with no "@" at all.
export const dropDomain = (email) => {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf("@");
  return at === -1 ? null : normalized.slice(at + 1);
};

export const validateInvite = (email, members = []) => {
  const normalized = normalizeEmail(email);
  if (!EMAIL.test(normalized)) return "Enter a valid email address";
  const taken = (Array.isArray(members) ? members : []).map(normalizeEmail);
  if (taken.includes(normalized)) return "Already a member";
  return null;
};
