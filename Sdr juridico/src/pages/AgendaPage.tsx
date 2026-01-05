import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import heroLight from '@/assets/hero-light.svg'
import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { agendaItems } from '@/data/mock'
import type { AgendaItem } from '@/types/domain'
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

const timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '16:00', '18:00']
const days = [
  { label: 'Dom', date: 14 },
  { label: 'Seg', date: 15 },
  { label: 'Ter', date: 16 },
  { label: 'Qua', date: 17 },
  { label: 'Qui', date: 18 },
  { label: 'Sex', date: 19 },
  { label: 'Sab', date: 20 },
]

const calendarEvents = [
  {
    id: 'evt-a',
    agendaId: 'ag-001',
    title: 'Mariana Souza',
    subtitle: 'Alinhamento de estrategia',
    status: 'Confirmada',
    dayIndex: 2,
    time: '10:00',
  },
  {
    id: 'evt-b',
    agendaId: 'ag-004',
    title: 'Audiencia aguardando protocolo',
    subtitle: 'Atencao',
    status: 'Atencao',
    dayIndex: 3,
    time: '14:00',
  },
  {
    id: 'evt-c',
    agendaId: 'ag-002',
    title: 'Carlos Martins',
    subtitle: 'Reuniao interna',
    status: 'Confirmada',
    dayIndex: 4,
    time: '10:00',
  },
  {
    id: 'evt-d',
    agendaId: 'ag-003',
    title: 'Rafael Souza',
    subtitle: 'Reuniao com ex-empregado',
    status: 'Em andamento',
    dayIndex: 5,
    time: '14:00',
  },
  {
    id: 'evt-e',
    agendaId: 'ag-005',
    title: 'SLA em risco',
    subtitle: 'Contrato pendente',
    status: 'Em atraso',
    dayIndex: 6,
    time: '11:30',
  },
]

const statusStyles: Record<
  string,
  { container: string; badge: string; button: string }
> = {
  Confirmada: {
    container: 'bg-[#DDEBFF] border-[#7FB2FF] text-[#2F4D9B]',
    badge: 'bg-white/70 border-white/80 text-[#2F4D9B]',
    button: 'bg-white text-[#2F4D9B] border-white/70',
  },
  'Em andamento': {
    container: 'bg-[#E8E4FF] border-[#9C8DFF] text-[#4C3B9C]',
    badge: 'bg-white/70 border-white/80 text-[#4C3B9C]',
    button: 'bg-white text-[#4C3B9C] border-white/70',
  },
  Atencao: {
    container: 'bg-[#FFF1CC] border-[#FFC44D] text-[#8A6B20]',
    badge: 'bg-white/70 border-white/80 text-[#8A6B20]',
    button: 'bg-white text-[#8A6B20] border-white/70',
  },
  'Em atraso': {
    container: 'bg-[#FFE1E1] border-[#FF7A7A] text-[#9B3B3B]',
    badge: 'bg-white/70 border-white/80 text-[#9B3B3B]',
    button: 'bg-white text-[#9B3B3B] border-white/70',
  },
}

export const AgendaPage = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [selectedItem, setSelectedItem] = React.useState<AgendaItem | null>(null)
  const state = resolveStatus(params.get('state'))
  const pageState = state !== 'ready' ? state : agendaItems.length ? 'ready' : 'empty'

  return (
    <div className="space-y-6">
      <header
        className="relative overflow-hidden rounded-3xl border bg-white p-6"
        style={{
          backgroundImage: `url(${heroLight})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right center',
          backgroundSize: '420px',
          backgroundColor: 'var(--agenda-card)',
          borderColor: 'var(--agenda-border)',
          boxShadow: 'var(--agenda-shadow)',
        }}
      >
        <div className="relative z-10 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.32em] text-text-subtle">
            Agenda juridica
          </p>
          <h2 className="font-display text-3xl text-text">Agenda juridica</h2>
          <p className="text-sm text-text-muted">Bom dia, Dr. Pedro Almeida</p>
        </div>
      </header>

      <PageState status={pageState} emptyTitle="Nenhum compromisso encontrado">
        <Card
          className="border bg-white"
          style={{
            backgroundColor: 'var(--agenda-card)',
            borderColor: 'var(--agenda-border)',
            boxShadow: 'var(--agenda-shadow)',
          }}
        >
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-text">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#E9ECF5] bg-white text-text"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#E9ECF5] bg-white text-text"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold">Abril 2024</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="rounded-2xl border bg-[#F7F8FC] p-1 text-xs"
                  style={{
                    borderColor: 'var(--agenda-border)',
                    boxShadow: 'var(--agenda-shadow-soft)',
                  }}
                >
                  <button className="rounded-xl bg-white px-3 py-1 text-primary shadow-sm">
                    Semana
                  </button>
                  <button className="rounded-xl px-3 py-1 text-text-subtle">
                    Mes
                  </button>
                </div>
                <Button variant="primary" size="sm">
                  + Novo Evento
                </Button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[2.3fr_1fr]">
              <div
                className="rounded-3xl border bg-[#F7F8FC] p-4"
                style={{
                  borderColor: 'var(--agenda-border)',
                  backgroundColor: 'var(--agenda-bg)',
                  boxShadow: 'var(--agenda-shadow)',
                }}
              >
                <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 text-xs text-text-muted">
                  <div />
                  {days.map((day) => (
                    <div
                      key={day.label}
                      className={cn(
                        'rounded-xl py-1 text-center text-sm text-text',
                        day.date === 16 && 'bg-primary/10 text-primary',
                      )}
                    >
                      {day.label} {day.date}
                    </div>
                  ))}
                  {timeSlots.map((slot) => (
                    <React.Fragment key={slot}>
                      <div className="text-right text-xs text-text-muted">{slot}</div>
                      {days.map((day) => (
                        <div
                          key={`${day.label}-${slot}`}
                          className="h-20 rounded-xl border bg-white/70 transition hover:bg-white"
                          style={{ borderColor: 'var(--agenda-grid)' }}
                        />
                      ))}
                    </React.Fragment>
                  ))}
                  {calendarEvents.map((event) => {
                    const rowIndex = timeSlots.findIndex((slot) =>
                      event.time.startsWith(slot.split(':')[0]),
                    )
                    const row = rowIndex + 2
                    const col = event.dayIndex + 2
                    const agendaItem =
                      agendaItems.find((item) => item.id === event.agendaId) ??
                      agendaItems[0]
                    const styles = statusStyles[event.status] ?? statusStyles.Confirmada
                    return (
                      <div
                        key={event.id}
                        role="button"
                        tabIndex={0}
                        className={cn(
                          'cursor-pointer rounded-2xl border px-3 py-3 text-left text-xs shadow-[0_10px_24px_rgba(18,38,63,0.12)]',
                          styles.container,
                        )}
                        style={{ gridColumnStart: col, gridRowStart: row }}
                        onClick={() => setSelectedItem(agendaItem)}
                        onKeyDown={(eventKey) => {
                          if (eventKey.key === 'Enter' || eventKey.key === ' ') {
                            setSelectedItem(agendaItem)
                          }
                        }}
                      >
                        <div className="flex items-center justify-between text-[10px] font-semibold">
                          <span>{event.time}</span>
                          <span className="rounded-full bg-white/60 px-2 py-0.5 text-[9px] text-text">
                            Agenda
                          </span>
                        </div>
                        <div className="mt-1 text-sm font-semibold text-text">
                          {event.title}
                        </div>
                        <div className="text-[11px] text-text-muted">
                          {event.subtitle}
                        </div>
                        <div className="mt-2 inline-flex items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                              styles.badge,
                            )}
                          >
                          {event.status}
                          </span>
                          <button
                            type="button"
                            className={cn(
                              'inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                              styles.button,
                            )}
                            onClick={(eventClick) => {
                              eventClick.stopPropagation()
                              if (agendaItem.casoId) {
                                navigate(`/app/caso/${agendaItem.casoId}`)
                              }
                            }}
                          >
                            Ver caso
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <Card
                  className="border bg-white"
                  style={{
                    backgroundColor: 'var(--agenda-card)',
                    borderColor: 'var(--agenda-border)',
                    boxShadow: 'var(--agenda-shadow)',
                  }}
                >
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-text">
                      <span className="font-semibold">Calendario</span>
                      <span className="text-xs text-text-subtle">Abril 2024</span>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-center text-xs text-text-muted">
                      {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((label) => (
                        <span key={label}>{label}</span>
                      ))}
                      {Array.from({ length: 28 }, (_, index) => (
                        <span
                          key={index}
                          className={cn(
                            'rounded-full py-1',
                            index === 17 && 'bg-primary/10 text-primary',
                          )}
                        >
                          {index + 1}
                        </span>
                      ))}
                    </div>
                    <div className="space-y-2 text-xs text-text-muted">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#7FB2FF]" />
                        Confirmada
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#9C8DFF]" />
                        Em andamento
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#FFC44D]" />
                        Atencao
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#FF7A7A]" />
                        Em atraso
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="border bg-white"
                  style={{
                    backgroundColor: 'var(--agenda-card)',
                    borderColor: 'var(--agenda-border)',
                    boxShadow: 'var(--agenda-shadow)',
                  }}
                >
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-text">
                      <span className="font-semibold">Proximas reunioes</span>
                      <button
                        type="button"
                        className="text-xs text-primary"
                        onClick={() => navigate('/app/agenda')}
                      >
                        Ver todos
                      </button>
                    </div>
                    {agendaItems.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="w-full rounded-2xl border bg-white px-3 py-3 text-left text-sm text-text hover:bg-[#F7F8FC]"
                        style={{
                          borderColor: 'var(--agenda-border)',
                          boxShadow: 'var(--agenda-shadow-soft)',
                        }}
                        onClick={() => setSelectedItem(item)}
                      >
                        <p className="font-semibold text-text">{item.title}</p>
                        <p className="text-xs text-text-muted">
                          {item.time} - {item.cliente}
                        </p>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageState>

      <Modal
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.title}
        description="Detalhes do compromisso (mock)."
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedItem(null)}>
              Fechar
            </Button>
            {selectedItem?.casoId && (
              <Button
                variant="primary"
                onClick={() => navigate(`/app/caso/${selectedItem.casoId}`)}
              >
                Abrir dossie
              </Button>
            )}
          </>
        }
      >
        {selectedItem && (
          <div className="space-y-3 text-sm text-text-muted">
            <div>
              <span className="text-xs uppercase tracking-wide text-text-subtle">
                Data
              </span>
              <p>{formatDateTime(`${selectedItem.date}T${selectedItem.time}:00`)}</p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wide text-text-subtle">
                Cliente
              </span>
              <p>{selectedItem.cliente}</p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wide text-text-subtle">
                Local
              </span>
              <p>{selectedItem.location}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
