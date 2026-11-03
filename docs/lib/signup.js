const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (email) => String(email ?? "").trim().toLowerCase();

export const validateSignup = (email, password) => {
  if (!EMAIL.test(normalizeEmail(email))) return "Enter a valid email address";
  if (String(password ?? "").length < 8) return "Use at least 8 characters for your password";
  return null;
};

// The page a completed sign up continues to. Keeping it in one place means the
// link and the post-submit redirect can never point at different pages.
export const signupDestination = (form) => {
  const next = String(form?.dataset?.next ?? "").trim();
  return next || "welcome.html";
};
