import { driveService } from './driveService'
import type { DriveProvider } from './driveService'

// ── Sanitize HTML exportado de DOCX/Google Docs ────────────────────────────────
// Remove styles verbosos de exportação DOCX, preserva semântica para o TipTap.
export function sanitizeHtml(rawHtml: string): string {
  // 1. Extrai apenas o conteúdo do <body>
  const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  let content = bodyMatch ? bodyMatch[1] : rawHtml

  // 2. Remove blocos <style>
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

  // 3. Remove atributos class e style (exportações de DOCX são verbosas)
  content = content.replace(/\s+(?:class|style)="[^"]*"/gi, '')

  // 4. Remove tags meta, link, script
  content = content.replace(/<(?:meta|link|script)[^>]*\/?>/gi, '')

  // 5. Remove tags vazias
  content = content.replace(/<(?:span|div|p)\s*>\s*<\/(?:span|div|p)>/gi, '')

  // 6. Remove atributos id desnecessários (Google Docs gera ids em todo elemento)
  content = content.replace(/\s+id="[^"]*"/gi, '')

  // 7. Normaliza whitespace excessivo
  content = content.replace(/\n{3,}/g, '\n\n').trim()

  return content
}

// ── Drive Import Service ───────────────────────────────────────────────────────
export const driveImportService = {
  // Exporta um arquivo do Drive como HTML limpo, pronto para o TipTap.
  async importFileAsHtml(fileId: string, provider: DriveProvider): Promise<string> {
    const rawHtml = await driveService.exportAsHtml(provider, fileId)
    return sanitizeHtml(rawHtml)
  },
}
