// Fetch SSL-permissivo para servidores governamentais brasileiros
//
// Muitos tribunais usam certificados ICP-Brasil não incluídos no CA bundle
// padrão do Node.js, causando "fetch failed" / UNABLE_TO_VERIFY_LEAF_SIGNATURE.
//
// Solução: undici Agent com rejectUnauthorized: false.
// Usamos undici.fetch diretamente (não o global fetch) para garantir que o
// dispatcher seja respeitado independentemente da versão do Node.js.

let _govFetch: typeof fetch | null = null

/**
 * Retorna uma implementação de fetch que aceita certificados ICP-Brasil
 * (self-signed ou com CA não confiada pelo Node.js).
 * O agente undici é criado uma única vez e reutilizado (singleton por processo).
 * Fallback para fetch nativo se undici não estiver disponível.
 */
export async function getGovFetch(): Promise<typeof fetch> {
  if (_govFetch) return _govFetch
  try {
    // undici é engine interna do Node.js 18+ — sempre disponível como dep transitiva
    const undici = await import('undici' as any)
    const agent  = new undici.Agent({ connect: { rejectUnauthorized: false } })
    // Usa undici.fetch diretamente com dispatcher explícito
    _govFetch = (url: any, opts: any = {}) =>
      undici.fetch(url, { ...opts, dispatcher: agent }) as Promise<Response>
  } catch {
    // Fallback: fetch nativo (pode falhar em SSL ICP-Brasil)
    _govFetch = fetch
  }
  return _govFetch!
}
