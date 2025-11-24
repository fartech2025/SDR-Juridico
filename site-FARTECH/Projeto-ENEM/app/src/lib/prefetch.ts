// Small prefetch helper to memoize dynamic imports used for route preloading
const prefetched = new Set<string>();

export function prefetchRoute(importer: () => Promise<any>, key?: string) {
  try {
    const k = key ?? (importer as any).toString();
    if (prefetched.has(k)) return;
    prefetched.add(k);
    // start the dynamic import; ignore errors
    void importer().catch(() => {});
  } catch (e) {
    // swallow any unexpected errors to keep handlers safe
    // console.debug('prefetchRoute failed', e);
  }
}

export function isPrefetched(key: string) {
  return prefetched.has(key);
}
