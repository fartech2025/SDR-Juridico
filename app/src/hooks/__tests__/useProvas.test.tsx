import { renderHook } from '@testing-library/react';
import { useProvas } from '../useProvas';

describe('useProvas', () => {
  it('deve retornar estado inicial correto', () => {
    const { result } = renderHook(() => useProvas());
    expect(result.current.provas).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });
});
