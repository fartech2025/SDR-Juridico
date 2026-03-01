// TourModal — guia de uso rápido por página.
// Disparado via ?tour=1 na URL (onboarding) ou pelo botão de ajuda no header.
// Fechar remove o query param sem adicionar ao histórico.

import * as React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  X, Users, Scale, FileText, Bell,
  Plus, Search, Upload, AlertTriangle, ArrowRight,
  LayoutDashboard, Briefcase, CalendarDays, ListTodo,
  FolderOpen, BarChart3, CircleDollarSign, Clock,
  Settings, Filter, Link2, Download,
} from 'lucide-react'

type TourStep = {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  title: string
  desc: string
}

type PageTour = {
  title: string
  subtitle: string
  steps: TourStep[]
}

export const PAGE_TOURS: Record<string, PageTour> = {
  '/app/dashboard': {
    title: 'Painel Principal',
    subtitle: 'Visão geral do escritório em tempo real',
    steps: [
      {
        icon: LayoutDashboard,
        title: 'KPIs operacionais',
        desc: 'Os cards no topo mostram casos abertos, leads ativos, clientes e tarefas pendentes. Clique em qualquer card para ir direto à lista.',
      },
      {
        icon: ListTodo,
        title: 'Plano do dia',
        desc: 'A seção "Para fazer" lista suas tarefas e compromissos do dia ordenados por urgência. Marque como concluída diretamente daqui.',
      },
      {
        icon: BarChart3,
        title: 'Rendimento da semana',
        desc: 'Acompanhe sua taxa de conclusão e entregas no prazo. O gráfico atualiza automaticamente conforme as tarefas são concluídas.',
      },
    ],
  },
  '/app/leads': {
    title: 'CRM de Leads',
    subtitle: 'Gerencie sua prospecção de clientes',
    steps: [
      {
        icon: Plus,
        title: 'Cadastre um lead',
        desc: 'Clique em "Novo Lead" no canto superior direito. Informe nome, contato e a etapa do funil em que o prospect se encontra.',
      },
      {
        icon: Users,
        title: 'Acompanhe o funil',
        desc: 'Use a aba "Kanban" para visualizar e arrastar leads entre etapas: Novo → Contato feito → Proposta enviada → Convertido.',
      },
      {
        icon: Filter,
        title: 'Filtre e organize',
        desc: 'Use os filtros de temperatura (quente/morno/frio), responsável e prazo para priorizar seus esforços de conversão.',
      },
    ],
  },
  '/app/clientes': {
    title: 'Clientes',
    subtitle: 'Gerencie sua carteira de clientes',
    steps: [
      {
        icon: Plus,
        title: 'Cadastre um cliente',
        desc: 'Clique em "Novo Cliente". Preencha dados como CPF/CNPJ, contato e tipo (Pessoa Física ou Jurídica). Um lead convertido pode ser transformado em cliente com um clique.',
      },
      {
        icon: Briefcase,
        title: 'Vincule casos',
        desc: 'Ao abrir a ficha de um cliente, visualize todos os casos associados, documentos, histórico de contato e processos DataJud vinculados.',
      },
      {
        icon: Search,
        title: 'Busque rapidamente',
        desc: 'Use o campo de busca para encontrar clientes por nome, CPF, CNPJ ou OAB. Os filtros por área jurídica e responsável ajudam a segmentar a carteira.',
      },
    ],
  },
  '/app/casos': {
    title: 'Casos',
    subtitle: 'Gestão completa dos processos do escritório',
    steps: [
      {
        icon: Plus,
        title: 'Abra um caso',
        desc: 'Clique em "Novo Caso". Informe o cliente, área jurídica, responsável e número CNJ (opcional — pode ser vinculado ao DataJud depois).',
      },
      {
        icon: Link2,
        title: 'Vincule ao DataJud',
        desc: 'Dentro do caso, clique em "Sincronizar via DataJud" para buscar movimentações em tempo real e manter o processo atualizado automaticamente.',
      },
      {
        icon: Filter,
        title: 'Filtre por status',
        desc: 'Use os filtros de status (Ativo, Em recurso, Arquivado), prioridade e responsável para encontrar rapidamente o que precisa.',
      },
    ],
  },
  '/app/agenda': {
    title: 'Agenda',
    subtitle: 'Compromissos, audiências e prazos em um só lugar',
    steps: [
      {
        icon: Plus,
        title: 'Crie um compromisso',
        desc: 'Clique em qualquer slot de horário ou no botão "Novo Evento". Informe título, data, hora, local e vincule a um caso ou cliente.',
      },
      {
        icon: CalendarDays,
        title: 'Sincronize com Google',
        desc: 'Conecte o Google Calendar em Configurações → Integrações para sincronizar automaticamente audiências e prazos entre o sistema e sua agenda pessoal.',
      },
      {
        icon: Bell,
        title: 'Receba lembretes',
        desc: 'Eventos com prazo judicial geram alertas automáticos no sino de notificações com antecedência configurável (1 dia, 3 dias, 1 semana).',
      },
    ],
  },
  '/app/tarefas': {
    title: 'Tarefas',
    subtitle: 'Organize e delegue atividades da equipe',
    steps: [
      {
        icon: Plus,
        title: 'Crie uma tarefa',
        desc: 'Clique em "Nova Tarefa". Defina título, responsável, prazo e prioridade. Vincule a um caso para rastrear a atividade no contexto certo.',
      },
      {
        icon: ListTodo,
        title: 'Use o Kanban',
        desc: 'Alterne para a visão Kanban e arraste tarefas entre colunas: A fazer → Em andamento → Revisão → Concluída.',
      },
      {
        icon: Filter,
        title: 'Filtre por responsável',
        desc: 'Gestores podem ver tarefas de toda a equipe. Use os filtros de responsável e prazo para identificar gargalos e redistribuir carga.',
      },
    ],
  },
  '/app/documentos': {
    title: 'Documentos',
    subtitle: 'Gestão centralizada de todos os arquivos',
    steps: [
      {
        icon: Upload,
        title: 'Faça upload de documentos',
        desc: 'Clique em "Upload" para enviar arquivos (PDF, DOCX, XLSX). O sistema organiza por cliente e caso automaticamente.',
      },
      {
        icon: FolderOpen,
        title: 'Organize por caso',
        desc: 'Use os filtros de cliente e caso para navegar na estrutura de pastas. Documentos vinculados a um caso aparecem na ficha do caso também.',
      },
      {
        icon: Download,
        title: 'Gere documentos via template',
        desc: 'Clique em "Templates" para criar documentos a partir de modelos com variáveis automáticas como {{cliente}}, {{data}} e {{advogado}}.',
      },
    ],
  },
  '/app/documentos/templates': {
    title: 'Templates de Documentos',
    subtitle: 'Crie modelos reutilizáveis com variáveis automáticas',
    steps: [
      {
        icon: Plus,
        title: 'Crie um template',
        desc: 'Clique em "Novo Template". Use o editor A4 para redigir seu modelo com formatação completa (negrito, tabelas, cores, fontes).',
      },
      {
        icon: FileText,
        title: 'Insira variáveis dinâmicas',
        desc: 'Use o botão "Variável" na toolbar para inserir campos automáticos: {{cliente}}, {{advogado}}, {{data_hoje}}, {{numero_processo}} e outros.',
      },
      {
        icon: ArrowRight,
        title: 'Gere o documento',
        desc: 'Na lista, clique em "Gerar" para preencher as variáveis, visualizar o PDF final e fazer download ou enviar para o Drive.',
      },
    ],
  },
  '/app/datajud': {
    title: 'DataJud — Processos CNJ',
    subtitle: 'Consulte e importe processos judiciais',
    steps: [
      {
        icon: Search,
        title: 'Pesquise pelo número CNJ',
        desc: 'Digite o número do processo no formato CNJ (ex: 0000001-00.2024.8.13.0000) no campo de busca e pressione Enter.',
      },
      {
        icon: Scale,
        title: 'Visualize movimentações',
        desc: 'O painel exibe todas as movimentações, audiências e decisões em tempo real direto da base do CNJ.',
      },
      {
        icon: Link2,
        title: 'Vincule a um caso',
        desc: 'Após encontrar o processo, clique em "Vincular ao caso" para associá-lo a um caso existente e manter sincronização automática.',
      },
    ],
  },
  '/app/diario-oficial': {
    title: 'Diário Oficial da União',
    subtitle: 'Monitore publicações relacionadas aos seus clientes',
    steps: [
      {
        icon: Search,
        title: 'Pesquise publicações',
        desc: 'Digite o nome do cliente, CPF ou CNPJ no campo de busca para localizar menções no DOU de qualquer data.',
      },
      {
        icon: Bell,
        title: 'Configure monitoramento',
        desc: 'Ative o monitoramento em um cliente para receber alertas automáticos sempre que ele for mencionado em novas edições do DOU.',
      },
      {
        icon: AlertTriangle,
        title: 'Receba alertas',
        desc: 'As publicações aparecem no sino de notificações no topo do sistema e podem ser vinculadas diretamente ao caso do cliente.',
      },
    ],
  },
  '/app/financeiro': {
    title: 'Módulo Financeiro',
    subtitle: 'Controle receitas, despesas e fluxo de caixa',
    steps: [
      {
        icon: Plus,
        title: 'Registre um lançamento',
        desc: 'Clique em "Novo Lançamento". Escolha se é receita ou despesa, informe valor, vencimento e categoria. Pode vincular a um caso ou cliente.',
      },
      {
        icon: CircleDollarSign,
        title: 'Acompanhe o fluxo de caixa',
        desc: 'O gráfico de fluxo de caixa mostra receitas e despesas mês a mês. A linha de saldo acumulado indica a saúde financeira do escritório.',
      },
      {
        icon: BarChart3,
        title: 'Veja a carteira por responsável',
        desc: 'A seção "Carteira por Responsável" mostra o saldo de honorários a receber segmentado por advogado — útil para comissões e metas.',
      },
    ],
  },
  '/app/timesheet': {
    title: 'Timesheet — Controle de Horas',
    subtitle: 'Registre e fature horas trabalhadas por caso',
    steps: [
      {
        icon: Plus,
        title: 'Registre uma entrada',
        desc: 'Clique em "Nova Entrada". Informe o caso, data, horas trabalhadas, atividade realizada e se é faturável ou não.',
      },
      {
        icon: Clock,
        title: 'Revise o período',
        desc: 'Use os filtros de período e responsável para revisar horas registradas antes de faturar. O total faturável aparece automaticamente.',
      },
      {
        icon: CircleDollarSign,
        title: 'Fature para o financeiro',
        desc: 'Clique em "Faturar período" para criar um lançamento no módulo financeiro com base nas horas selecionadas e a taxa horária configurada.',
      },
    ],
  },
  '/app/analytics': {
    title: 'Analytics Executivo',
    subtitle: 'Indicadores estratégicos do escritório',
    steps: [
      {
        icon: BarChart3,
        title: 'KPIs operacionais e financeiros',
        desc: 'As duas linhas de cards no topo mostram métricas-chave: casos, leads, contratos, receita, resultado e inadimplência do mês atual.',
      },
      {
        icon: Users,
        title: 'Desempenho da equipe',
        desc: 'O gráfico "Desempenho por colaborador" e o ranking do time permitem identificar quem está convertendo mais e gerando mais receita.',
      },
      {
        icon: Filter,
        title: 'Filtre por período',
        desc: 'Use os seletores de mês/ano para comparar diferentes períodos e acompanhar a evolução do escritório ao longo do tempo.',
      },
    ],
  },
  '/app/config': {
    title: 'Configurações',
    subtitle: 'Personalize o sistema para o seu escritório',
    steps: [
      {
        icon: Settings,
        title: 'Dados do escritório',
        desc: 'Na aba "Essencial", atualize nome, CNPJ, OAB, endereço e logo do escritório. Essas informações aparecem no cabeçalho dos documentos gerados.',
      },
      {
        icon: Users,
        title: 'Gerencie a equipe',
        desc: 'Na aba "Equipe", convide membros por e-mail e defina seus papéis: Administrador, Advogado, Secretaria ou Leitura.',
      },
      {
        icon: Link2,
        title: 'Conecte integrações',
        desc: 'Na aba "Integrações", conecte o Google Calendar para sincronizar a agenda e configure o DataJud com sua chave de API do CNJ.',
      },
    ],
  },
}

/** Retorna o tour correspondente ao pathname atual (match exato ou por prefixo). */
export function getTourForPath(pathname: string): PageTour | null {
  // Tenta match exato primeiro
  if (PAGE_TOURS[pathname]) return PAGE_TOURS[pathname]
  // Fallback: prefixo mais específico
  const match = Object.keys(PAGE_TOURS)
    .filter(k => pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0]
  return match ? PAGE_TOURS[match] : null
}

export function hasTour(pathname: string): boolean {
  return getTourForPath(pathname) !== null
}

// ---------------------------------------------------------------------------

export function TourModal() {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = React.useState(false)
  const [tour, setTour] = React.useState<PageTour | null>(null)

  React.useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('tour') !== '1') { setOpen(false); return }
    const pageTour = getTourForPath(location.pathname)
    if (!pageTour) { setOpen(false); return }
    setTour(pageTour)
    setOpen(true)
  }, [location.pathname, location.search])

  const handleClose = React.useCallback(() => {
    setOpen(false)
    const params = new URLSearchParams(location.search)
    params.delete('tour')
    const newSearch = params.toString()
    navigate(
      { pathname: location.pathname, search: newSearch ? `?${newSearch}` : '' },
      { replace: true }
    )
  }, [location.pathname, location.search, navigate])

  React.useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, handleClose])

  if (!open || !tour) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: '100%', maxWidth: 480, padding: '0 16px' }}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div style={{ backgroundColor: '#721011', padding: '20px 24px' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-white font-semibold text-base leading-tight">{tour.title}</h2>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>{tour.subtitle}</p>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-1 hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          {/* Steps */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tour.steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: '#fef2f2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <step.icon style={{ color: '#721011', width: 16, height: 16 }} />
                  </div>
                  {i < tour.steps.length - 1 && (
                    <div style={{ width: 1, height: 12, backgroundColor: '#e5e7eb' }} />
                  )}
                </div>
                <div style={{ paddingTop: 2 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 3px' }}>
                    {i + 1}. {step.title}
                  </p>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.55 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: '0 24px 20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleClose}
              style={{
                padding: '10px 28px',
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                backgroundColor: '#721011',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
