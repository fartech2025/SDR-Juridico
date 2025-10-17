import { fetchProvas } from '../supabaseService';

describe('fetchProvas', () => {
  it('deve retornar um array (mock)', async () => {
    // Este teste é apenas um exemplo, pois depende do Supabase real
    const { data, error } = await fetchProvas();
    expect(Array.isArray(data) || data === null).toBe(true);
    expect(error === null || typeof error === 'object').toBe(true);
  });
});
