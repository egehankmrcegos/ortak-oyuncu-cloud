export function nativeCors(origin: string | null) {
  if(origin && !['capacitor://localhost','http://localhost:8080','http://localhost:4174'].includes(origin)) return null;
  return { 'Access-Control-Allow-Origin': origin ?? 'capacitor://localhost', 'Access-Control-Allow-Methods':'POST, OPTIONS', 'Access-Control-Allow-Headers':'Content-Type', 'Vary':'Origin', 'Cache-Control':'no-store' };
}