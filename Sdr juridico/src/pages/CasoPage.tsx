import * as React from 'react'
import {
  ChevronDown,
  ChevronLeft,
  Filter,
  FileText,
  KeyRound,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import heroLight from '@/assets/hero-light.svg'
import { PageState } from '@/components/PageState'
import { Timeline } from '@/components/Timeline'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { casos, documentos, leads, timelineEvents } from '@/data/mock'
import type { Caso } from '@/types/domain'
import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/format'

const resolveStatus = (
  value: string | null,
): 'loading' | 'empty' | 'error' | 'ready' => {
  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value
  }
  return 'ready'
}

const tabs = [
  'Tudo',
  'Documentos',
  'Agenda',
  'Comercial',
  'Juridico',
  'Automacao',
  'Humano',
] as const
type TabKey = (typeof tabs)[number]

const categoryMap: Record<TabKey, string | null> = {
  Tudo: null,
  Documentos: 'docs',
  Agenda: 'agenda',
  Comercial: 'comercial',
  Juridico: 'juridico',
  Automacao: 'automacao',
  Humano: 'humano',
}

const statusBadge = (status: Caso['status']) => {
  if (status === 'encerrado') return 'danger'
  if (status === 'suspenso') return 'warning'
  return 'success'
}

export const CasoPage = () => {
  const { id } = useParams()
  const [params] = useSearchParams()
  const status = resolveStatus(params.get('state'))
  const [activeTab, setActiveTab] = React.useState<TabKey>('Tudo')
  const [modalOpen, setModalOpen] = React.useState(false)

  const caso = casos.find((item) => item.id === id) ?? casos[0]
  const lead = leads.find((item) => item.id === caso.leadId)
  const caseDocs = documentos.filter((doc) => doc.casoId === caso.id)
  const caseEvents = timelineEvents.filter((event) => event.casoId === caso.id)
  const filteredEvents = categoryMap[activeTab]
    ? caseEvents.filter((event) => event.category === categoryMap[activeTab])
    : caseEvents

  const highlights = [
    {
      id: 'high-1',
      label: 'Resumo gerado por IA',
      content:
        'Carlos Martins, ex-empregado da ACME Ltda, solicitou revisao de horas extras e verbas rescisorias.',
    },
    {
      id: 'high-2',
      label: 'Pontos relevantes',
      content:
        'Testemunha chave Joao Silva mencionada na ultima conversa; pagamento de horas extras em aberto.',
    },
  ]

  const checklist = [
    { id: 'ck-1', label: 'Contagem de horas extras', status: 'ok' },
    { id: 'ck-2', label: 'Contrato de trabalho', status: 'pendente' },
    { id: 'ck-3', label: 'Comprovacoes de jornada', status: 'pendente' },
    { id: 'ck-4', label: 'Holerites do periodo', status: 'ok' },
  ]

  return (
    <div className="space-y-6">
      <header
        className="relative overflow-hidden rounded-3xl border border-border bg-white p-6 shadow-soft"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.94) 72%, rgba(255,216,232,0.22) 100%), url(${heroLight})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right center',
          backgroundSize: '520px',
          backgroundColor: 'var(--agenda-card)',
          borderColor: 'var(--agenda-border)',
          boxShadow: 'var(--agenda-shadow)',
        }}
      >
        <div className="relative z-10 space-y-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs text-text-subtle shadow-soft"
          >
            <ChevronLeft className="h-4 w-4" />
            #{caso.id.replace('caso-', '')}
          </button>
          <h2 className="font-display text-2xl text-text">
            {caso.id.replace('caso-', '#')} - {caso.cliente}
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-subtle">
            <Badge variant={statusBadge(caso.status)} className="capitalize">
              {caso.status}
            </Badge>
            <Badge variant="info">{caso.area}</Badge>
            <Badge variant="default">{caso.stage}</Badge>
          </div>
        </div>
      </header>

      <PageState status={status}>
        <div className="grid gap-6 xl:grid-cols-[2.4fr_1fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-xs font-medium transition',
                    activeTab === tab
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border bg-white text-text-subtle hover:bg-[#F2F5FF] hover:text-text',
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
                <Input
                  placeholder="Buscar casos..."
                  className="h-11 rounded-full border border-border bg-[#EEF4FF] pl-11"
                />
              </div>
              <Button variant="outline" size="sm" className="h-11 rounded-full px-4">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </div>

            {activeTab === 'Tudo' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>Dossie Juridico</CardTitle>
                        <p className="text-xs text-text-subtle">
                          Resumo gerado e pontos relevantes.
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-text-muted">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-border bg-gradient-to-br from-[#FFF5F8] via-white to-white p-4 shadow-[0_8px_20px_rgba(18,38,63,0.06)]">
                        <div className="flex items-center gap-2 text-sm font-semibold text-text">
                          <FileText className="h-4 w-4 text-[#D36D8C]" />
                          Resumo gerado por IA
                        </div>
                        <p className="mt-2 text-sm text-text-muted">
                          {highlights[0]?.content}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border bg-gradient-to-br from-[#F2F7FF] via-white to-white p-4 shadow-[0_8px_20px_rgba(18,38,63,0.06)]">
                        <div className="flex items-center gap-2 text-sm font-semibold text-text">
                          <KeyRound className="h-4 w-4 text-[#6BB9A8]" />
                          Pontos relevantes
                        </div>
                        <p className="mt-2 text-sm text-text-muted">
                          {highlights[1]?.content}
                        </p>
                      </div>
                    </div>
                    <Button variant="primary" size="sm" className="w-full">
                      Ver linha do tempo completa
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                <Timeline events={filteredEvents} onAddEvent={() => setModalOpen(true)} />
              </div>
            )}

            {activeTab !== 'Tudo' && (
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle>{activeTab}</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
                    Adicionar evento
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-text-muted">
                  {filteredEvents.length ? (
                    filteredEvents.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-2xl border border-border bg-white p-3 shadow-[0_8px_20px_rgba(18,38,63,0.06)]"
                      >
                        <p className="text-sm font-semibold text-text">{event.title}</p>
                        <p className="text-xs text-text-subtle">{event.description}</p>
                        <p className="mt-2 text-[11px] text-text-subtle">
                          {formatDateTime(event.date)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-border bg-white p-4 text-sm text-text-muted shadow-[0_8px_20px_rgba(18,38,63,0.06)]">
                      Sem eventos para esta categoria.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <aside className="space-y-4">
            <Card>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {caso.cliente
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">{caso.cliente}</p>
                    <p className="text-xs text-text-subtle">
                      {lead?.email ?? 'cliente@email.com'}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-white px-3 py-2 text-xs text-text shadow-[0_8px_20px_rgba(18,38,63,0.06)]">
                  {lead?.phone ?? '(11) 99999-0000'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Checklist Processual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-text-muted">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-border bg-white px-3 py-2 shadow-[0_8px_20px_rgba(18,38,63,0.06)]"
                  >
                    <span>{item.label}</span>
                    <span
                      className={cn(
                        'rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase',
                        item.status === 'ok'
                          ? 'border-[#CFEBD8] bg-[#E8F7EE] text-[#167A3D]'
                          : 'border-[#F1D28A] bg-[#FFF1CC] text-[#8A5A00]',
                      )}
                    >
                      {item.status === 'ok' ? 'ok' : 'pendente'}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documentos recentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-text-muted">
                {caseDocs.slice(0, 3).map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-2xl border border-border bg-white px-3 py-2 shadow-[0_8px_20px_rgba(18,38,63,0.06)]"
                  >
                    <div className="text-sm font-semibold text-text">{doc.title}</div>
                    <div className="text-xs text-text-subtle">{doc.status}</div>
                  </div>
                ))}
                <Link to="/app/documentos" className="text-xs text-primary hover:underline">
                  Ver documentos
                </Link>
              </CardContent>
            </Card>
          </aside>
        </div>
      </PageState>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Adicionar evento"
        description="Registre um novo evento juridico (mock)."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Salvar evento
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-text-subtle">
              Titulo
            </label>
            <Input placeholder="Descreva o evento" />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-text-subtle">
              Categoria
            </label>
            <select className="h-10 w-full rounded-2xl border border-border bg-white px-3 text-sm text-text">
              <option>Docs</option>
              <option>Agenda</option>
              <option>Comercial</option>
              <option>Juridico</option>
              <option>Automacao</option>
              <option>Humano</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-text-subtle">
              Descricao
            </label>
            <textarea
              className="min-h-[120px] w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm text-text"
              placeholder="Detalhes do evento"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
