import { useCallback } from 'react';
export function useServerFn<T extends (...args:any[])=>any>(fn:T):T { return useCallback(fn,[fn]); }