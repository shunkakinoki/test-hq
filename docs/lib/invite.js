const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalize = (email) => String(email ?? "").trim().toLowerCase();

export const validateInvite = (email, members = []) => {
  const normalized = normalize(email);
  if (!EMAIL.test(normalized)) return "Enter a valid email address";
  const existing = (Array.isArray(members) ? members : []).map(normalize);
  if (existing.includes(normalized)) return "Already a member";
  return null;
};

/**
 * Attempt to deliver an invite.
 *
 * `send` is the transport. When it is missing the invite is NOT sent and the
 * caller must say so - validation passing is not the same as delivery.
 */
export const submitInvite = async (email, members, send) => {
  const problem = validateInvite(email, members);
  if (problem) return { sent: false, message: problem };
  if (typeof send !== "function") {
    return {
      sent: false,
      message: "Invites are not available yet - nothing was sent. Please try again later.",
    };
  }
  try {
    await send(normalize(email));
    return { sent: true, message: `Invite sent to ${normalize(email)}` };
  } catch (error) {
    return {
      sent: false,
      message: `Could not send the invite - ${String(error?.message ?? error)}. Please try again.`,
    };
  }
};
