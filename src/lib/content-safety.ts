import { playerNameKey } from './football-catalog';
const forbidden = new Set(['amk','aq','orospu','pic','siktir','sikik','yarrak','ibne','fuck','shit','bitch','nigger','faggot']);
export function assertSafeContent(value: string) {
  const key = playerNameKey(value).replace(/0/g,'o').replace(/1/g,'i').replace(/3/g,'e').replace(/4/g,'a');
  if (key.split(' ').some(word => forbidden.has(word)) || /https?:|www\.|@|\b\d{7,}\b/i.test(value)) throw new Error('Uygunsuz içerik veya kişisel bilgi kullanma. Lütfen farklı bir ad yaz.');
  return value;
}
export const GAME_RETENTION_DAYS = 30;
export const REPORT_RETENTION_DAYS = 90;