// Cache em memória com TTL — sem dependências externas
interface CacheEntry<T> {
  data: T
  expires: number
}

const store = new Map<string, CacheEntry<unknown>>()

export function get<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() > entry.expires) {
    store.delete(key)
    return null
  }
  return entry.data
}

export function set<T>(key: string, data: T, ttlMs: number = 6 * 60 * 60 * 1000): void {
  store.set(key, { data, expires: Date.now() + ttlMs })
}

export function invalidate(key: string): void {
  store.delete(key)
}

export function stats(): { size: number; keys: string[] } {
  // Limpar expirados antes de retornar stats
  for (const [k, v] of store.entries()) {
    if (Date.now() > v.expires) store.delete(k)
  }
  return { size: store.size, keys: Array.from(store.keys()) }
}

export function clear(): number {
  const count = store.size
  store.clear()
  return count
}
