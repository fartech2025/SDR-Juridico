/**
 * PDF Report Service
 * Centraliza padrão de geração de PDFs para toda aplicação
 * Usa brand colors, logo e layout consistentes
 */

// Brand color: #721011 = RGB(114, 16, 17)
const BRAND_COLOR_RGB = [114, 16, 17] as const
const TEXT_DARK = [40, 40, 40]
const TEXT_LIGHT = [150, 150, 150]
const ALT_ROW_COLOR = [248, 248, 248]
const BORDER_COLOR = 220

const HEADER_HEIGHT = 30
const MARGIN = 15
const TOP_MARGIN = HEADER_HEIGHT + 10

export interface PDFReportOptions {
  title: string
  subtitle?: string
  filename: string
  logo?: string
  data?: Record<string, unknown>
}

export async function getCompanyLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch('/logo-mark.png')
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/**
 * Cria header padrão para PDFs
 * Inclui background brand color, logo e título
 */
export async function addPdfHeader(
  doc: any,
  title: string,
  subtitle?: string,
): Promise<void> {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Background header
  doc.setFillColor(...BRAND_COLOR_RGB)
  doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F')

  // Logo
  const logo = await getCompanyLogoDataUrl()
  if (logo) {
    doc.addImage(logo, 'PNG', MARGIN, 6, 12, 12)
  }

  // Título
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`TALENTJUD | ${title}`, logo ? MARGIN + 16 : MARGIN, 13)

  // Subtítulo
  if (subtitle) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(subtitle, logo ? MARGIN + 16 : MARGIN, 20)
  }

  // Data de emissão
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const now = new Date()
  doc.text(`Emitido em: ${now.toLocaleString('pt-BR')}`, pageWidth - MARGIN, subtitle ? 20 : 13, { align: 'right' })
}

/**
 * Cria footer padrão para PDFs com número de página
 */
export function addPdfFooters(doc: any, reportType: string): void {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const totalPages = (doc as any).internal.getNumberOfPages()

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...TEXT_LIGHT)
    doc.text(
      `TalentJUD - ${reportType} | Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' },
    )
  }
}

/**
 * Configura tema padrão para tabelas (autoTable)
 */
export function getTableTheme() {
  return {
    styles: {
      fontSize: 9,
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: BRAND_COLOR_RGB,
      textColor: 255,
      fontStyle: 'bold' as const,
    },
    alternateRowStyles: {
      fillColor: ALT_ROW_COLOR,
    },
    margin: { left: MARGIN, right: MARGIN },
  }
}

/**
 * Cria seção com título padrão em PDFs
 */
export function addSection(doc: any, y: number, title: string): number {
  doc.setTextColor(...TEXT_DARK)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(title, MARGIN, y)
  y += 4
  doc.setDrawColor(BORDER_COLOR)
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.line(MARGIN, y, pageWidth - MARGIN, y)
  y += 6
  return y
}

/**
 * Adiciona espaço se necessário antes de novo conteúdo
 */
export function ensureSpace(doc: any, y: number, needed: number, pageHeight: number = 297): { y: number; newPage: boolean } {
  const bottomMargin = 10
  if (y + needed > pageHeight - bottomMargin) {
    doc.addPage()
    return { y: TOP_MARGIN, newPage: true }
  }
  return { y, newPage: false }
}

/**
 * Formata data para PT-BR
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR')
}

/**
 * Formata valor monetário
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export { MARGIN, TOP_MARGIN, HEADER_HEIGHT, BRAND_COLOR_RGB }
