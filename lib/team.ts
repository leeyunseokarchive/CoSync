export function generateInviteCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const chunk = () =>
    Array.from({ length: 3 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join("");
  return `${chunk()}-${chunk()}-${chunk()}`;
}
