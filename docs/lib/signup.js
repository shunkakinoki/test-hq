// Validation and post-submit navigation for the sign-up flow.
// Kept as a pure module so the same rules can be exercised by `node --test`.

export const MIN_PASSWORD_LENGTH = 8;
export const SIGNUP_NEXT = "welcome.html";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// fields is a plain object: { email, password } taken from the sign-up form.
export const validateSignup = (fields) => {
  const email = String(fields?.email ?? "").trim();
  const password = String(fields?.password ?? "");
  if (!EMAIL.test(email)) return "Enter a valid email address";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters for your password`;
  }
  return null;
};

// Returns { ok, next, message }. `next` is only set when the account details are
// valid, so the page never advances on a rejected form.
export const signupStep = (fields, next = SIGNUP_NEXT) => {
  const problem = validateSignup(fields);
  if (problem) return { ok: false, next: null, message: problem };
  return { ok: true, next, message: "Account created" };
};
