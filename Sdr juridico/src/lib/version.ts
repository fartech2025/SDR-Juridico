export const APP_VERSION = '2.9.0'

// Novidades exibidas no modal "O que há de novo" ao atualizar a versão
export const VERSION_HIGHLIGHTS: Record<string, { title: string; items: string[] }> = {
  '2.9.0': {
    title: 'Templates de Documentos + Branding',
    items: [
      'Editor de templates com TipTap (tabelas, cores, fontes)',
      'Geração de PDF com cabeçalho/rodapé do escritório',
      'Importação de modelos do Google Drive e OneDrive',
      "Marca d'água configurável nos PDFs",
      'Controle de horas (Timesheet) integrado ao Financeiro',
      'Onboarding guiado para novos escritórios',
    ],
  },
  '2.8.0': {
    title: 'Financeiro & Analytics Executivo',
    items: [
      'Módulo financeiro com fluxo de caixa',
      'Painel executivo de KPIs',
      'Views personalizadas por perfil (advogado, secretaria, gestor)',
    ],
  },
}
