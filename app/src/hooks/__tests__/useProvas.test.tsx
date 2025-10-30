import { renderHook, waitFor } from '@testing-library/react';
import { useProvas } from '../useProvas';

describe('useProvas', () => {
  it('deve carregar provas sem erros', async () => {
    const { result } = renderHook(() => useProvas());
    expect(result.current.provas).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(Array.isArray(result.current.provas)).toBe(true);
  });
});
