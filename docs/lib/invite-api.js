import { normalizeEmail } from "./invite.js";

// The one place that actually sends an invite. The page used to write
// "Invite sent to <email>" straight into the DOM and never called anything, so
// a teammate was told an invite had gone out when no request ever left the page.
export const INVITE_ENDPOINT = "/api/invites";

export async function sendInvite(email, { fetchImpl = fetch } = {}) {
  const response = await fetchImpl(INVITE_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: normalizeEmail(email) }),
  });
  if (!response.ok) {
    throw new Error(`the invite service answered HTTP ${response.status}`);
  }
  return response.json().catch(() => ({}));
}
