import { useCallback } from 'react';

export function useError() {
  // Hook para lançar erros de forma programática
  return useCallback((error: Error | string) => {
    throw typeof error === 'string' ? new Error(error) : error;
  }, []);
}
