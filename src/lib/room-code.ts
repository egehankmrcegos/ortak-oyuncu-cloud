const codePattern = /^[A-Z0-9]{3,8}$/;

// Recover only an explicit invitation, never truncate arbitrary invalid input.
export function parseRoomCode(input: string): string | null {
  let value = input.trim();
  try { value = decodeURIComponent(value); } catch { return null; }
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const path = /^\/oda\/([^/]+)\/?$/.exec(url.pathname);
      if (!path?.[1]) return null;
      value = decodeURIComponent(path[1]);
    } catch { return null; }
  }
  const upper = value.toLocaleUpperCase("tr-TR");
  if (codePattern.test(upper)) return upper;
  const invitation = /^([A-Z0-9]{3,8})\s+FUTBOL OYUNUNA GEL!\s+ODA KODU:\s*([A-Z0-9]{3,8})\s*$/u.exec(upper);
  return invitation?.[1] && invitation[1] === invitation[2] ? invitation[1] : null;
}

export function requireRoomCode(input: string): string {
  const code = parseRoomCode(input);
  if (!code) throw new Error("Davet bağlantısı geçersiz. Oda kodunu kontrol edip tekrar dene.");
  return code;
}

export function roomInviteUrl(origin: string, code: string): string {
  return `${origin}/oda/${requireRoomCode(code)}`;
}