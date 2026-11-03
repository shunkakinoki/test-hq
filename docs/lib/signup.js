const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 8;

export const signupNextStep = (email, password) => {
  const normalized = String(email ?? "").trim().toLowerCase();
  if (!EMAIL.test(normalized)) {
    return { ok: false, error: "Enter a valid email address", next: null };
  }
  if (String(password ?? "").length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      next: null,
    };
  }
  return { ok: true, error: null, next: "welcome.html" };
};
