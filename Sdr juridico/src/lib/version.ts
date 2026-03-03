export const APP_VERSION = '3.0.0'

// Novidades exibidas no modal "O que há de novo" ao atualizar a versão
export const VERSION_HIGHLIGHTS: Record<string, { title: string; items: string[] }> = {
  '3.0.0': {
    title: 'Sidebar Inteligente + Página do Plano',
    items: [
      'Módulos bloqueados agora aparecem no sidebar com ícone de cadeado',
      'Nova página "Meu Plano" com visão geral dos módulos disponíveis',
      'Clique em módulo bloqueado redireciona para informações do plano',
    ],
  },
  '2.9.3': {
    title: 'Filtros Persistentes',
    items: [
      'Filtros de Leads, Casos e Clientes agora persistem via URL',
      'Voltar de um registro mantém os filtros aplicados',
      'Compartilhe buscas diretamente pela URL',
    ],
  },
  '2.9.2': {
    title: 'Melhorias de Usabilidade',
    items: [
      'Seletor de função com descrições detalhadas no convite de membros',
      'Aviso quando o Timesheet requer o módulo Financeiro',
      'Dica de busca por CPF/CNPJ no Diário Oficial',
      'Hint de variáveis automáticas nos templates de documentos',
    ],
  },
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
