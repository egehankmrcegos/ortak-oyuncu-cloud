export type Identity = { playerId: string; token: string };
const key = (code: string) => `omubumu:${code.toUpperCase()}`;
export function saveIdentity(code: string, id: Identity) {
  localStorage.setItem(key(code), JSON.stringify(id));
}
export function loadIdentity(code: string): Identity | null {
  try { return JSON.parse(localStorage.getItem(key(code)) || "null"); } catch { return null; }
}
