export const SUPPORT_EMAIL = "egehankomurcu228@gmail.com";
export const AI_CONSENT_KEY = "omubumu:privacy-consent:v2";
export const AI_CONSENT_VERSION = "2026-11-17-football-api";

export function hasAIConsent(storage: Pick<Storage, "getItem">): boolean {
  try { return storage.getItem(AI_CONSENT_KEY) === AI_CONSENT_VERSION; }
  catch { return false; }
}

export function forgetLocalGameData(storage: Pick<Storage, "length" | "key" | "removeItem">) {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith("omubumu:")) keys.push(key);
  }
  keys.forEach(key => storage.removeItem(key));
}
