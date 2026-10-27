const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateInvite = (email, members) => {
  const normalized = String(email ?? "").trim().toLowerCase();
  const domain = normalized.split("@")[1];
  if (!EMAIL.test(normalized)) return "Enter a valid email address";
  if (members.includes(normalized)) return "Already a member";
  return null;
};
