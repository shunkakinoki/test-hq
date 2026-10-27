export const sendInviteV1 = (email) => {
  return fetch("/api/v1/invites", { method: "POST", body: JSON.stringify({ email }) });
};
