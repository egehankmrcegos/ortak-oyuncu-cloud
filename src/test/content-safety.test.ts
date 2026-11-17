import { describe,it,expect } from 'vitest';
import { assertSafeContent,GAME_RETENTION_DAYS,REPORT_RETENTION_DAYS } from '@/lib/content-safety';
import { nativeCors } from '@/lib/native-api-security';
describe('game safety',()=>{
  it('rejects profanity even with simple digit substitution',()=>{expect(()=>assertSafeContent('0rospu')).toThrow();});
  it('keeps real football names',()=>{expect(assertSafeContent('Lionel Messi')).toBe('Lionel Messi');});
  it('rejects personal contact details',()=>{expect(()=>assertSafeContent('user@example.org')).toThrow();});
  it('retains game records for 30 days',()=>{expect(GAME_RETENTION_DAYS).toBe(30);});
  it('retains safety reports for 90 days',()=>{expect(REPORT_RETENTION_DAYS).toBe(90);});
  it('allows only configured native origins',()=>{expect(nativeCors('capacitor://localhost')?.['Access-Control-Allow-Origin']).toBe('capacitor://localhost');expect(nativeCors('https://evil.example')).toBeNull();});
});