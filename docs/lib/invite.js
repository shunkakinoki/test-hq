import { INVITES_ENDPOINT } from "./invite-config.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateInvite = (email, members) => {
  const normalized = String(email ?? "").trim().toLowerCase();
  if (!EMAIL.test(normalized)) return "Enter a valid email address";
  if (members.includes(normalized)) return "Already a member";
  return null;
};

// Returns { ok, message }. `ok` is only true once a delivery endpoint has actually
// accepted the invite, so the page never claims "Invite sent" without a send.
export const sendInvite = async (
  email,
  members,
  endpoint = INVITES_ENDPOINT,
  fetchImpl = globalThis.fetch,
) => {
  const problem = validateInvite(email, members);
  if (problem) return { ok: false, message: problem };

  const target = String(email ?? "").trim().toLowerCase();
  if (!endpoint) {
    return {
      ok: false,
      message: `Invites are not available yet, so ${target} was not invited`,
    };
  }

  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: target }),
    });
    if (!response?.ok) {
      return { ok: false, message: `The invite service rejected the invite for ${target}` };
    }
    return { ok: true, message: `Invite sent to ${target}` };
  } catch {
    return { ok: false, message: `The invite service could not be reached, so ${target} was not invited` };
  }
};
