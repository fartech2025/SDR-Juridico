// Shared form modal for creating and editing Tarefas.
// Used by TarefasPage (lista) and TarefasKanbanPage (kanban) for a unified UX.
import * as React from 'react'
import type { CSSProperties } from 'react'
import { AlertCircle } from 'lucide-react'

import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import type { Tarefa } from '@/types/domain'
import { useLeads } from '@/hooks/useLeads'
import { useClientes } from '@/hooks/useClientes'
import { useCasos } from '@/hooks/useCasos'
import { useOrganization } from '@/contexts/OrganizationContext'
import { supabase } from '@/lib/supabaseClient'

// ── Types ──────────────────────────────────────────────────────────────────────

type LinkType = 'none' | 'lead' | 'cliente' | 'caso'

export interface TarefaFormValues {
  title: string
  description: string
  priority: Tarefa['priority']
  status: Tarefa['status']
  dueDate: string
  linkType: LinkType
  linkId: string
  ownerId: string
}

export const buildDefaultValues = (): TarefaFormValues => ({
  title: '',
  description: '',
  priority: 'normal',
  status: 'pendente',
  dueDate: '',
  linkType: 'none',
  linkId: '',
  ownerId: '',
})

interface TarefaFormModalProps {
  open: boolean
  onClose: () => void
  /** Called with form values when the user confirms. Throw to show an error. */
  onSave: (values: TarefaFormValues) => Promise<void>
  initialValues?: Partial<TarefaFormValues>
  /** Modal title — defaults to "Nova Tarefa" */
  title?: string
  /** Show a Status field in the form (useful for edit mode in lista view) */
  showStatus?: boolean
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const RING_STYLE = { '--tw-ring-color': 'rgba(114, 16, 17, 0.2)' } as CSSProperties

const INPUT_CLS =
  'h-10 w-full rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent'

const SELECT_CLS =
  'h-10 w-full rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white'

const LABEL_CLS = 'text-xs uppercase tracking-wide text-gray-500'

// ── Component ──────────────────────────────────────────────────────────────────

export function TarefaFormModal({
  open,
  onClose,
  onSave,
  initialValues,
  title = 'Nova Tarefa',
  showStatus = false,
}: TarefaFormModalProps) {
  const { leads }    = useLeads()
  const { clientes } = useClientes()
  const { casos }    = useCasos()
  const { currentOrg } = useOrganization()

  const [orgUsers, setOrgUsers] = React.useState<Array<{ id: string; nome_completo: string }>>([])
  const [form, setForm]         = React.useState<TarefaFormValues>(() => ({
    ...buildDefaultValues(),
    ...initialValues,
  }))
  const [saving, setSaving] = React.useState(false)
  const [error, setError]   = React.useState<string | null>(null)

  // Reset form when opened/initialValues change
  React.useEffect(() => {
    if (open) {
      setForm({ ...buildDefaultValues(), ...initialValues })
      setError(null)
      setSaving(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Fetch org users for the responsável dropdown.
  // Membership is tracked in org_members; usuarios.org_id may not be populated.
  React.useEffect(() => {
    if (!currentOrg?.id) return
    const orgId = currentOrg.id
    ;(async () => {
      try {
        const { data: members } = await supabase
          .from('org_members')
          .select('user_id')
          .eq('org_id', orgId)
          .eq('ativo', true)

        const userIds = (members ?? []).map((m) => m.user_id)
        if (userIds.length === 0) return

        const { data: users } = await supabase
          .from('usuarios')
          .select('id, nome_completo')
          .in('id', userIds)
          .order('nome_completo')

        if (users) setOrgUsers(users as Array<{ id: string; nome_completo: string }>)
      } catch (err) {
        console.error('[TarefaFormModal] orgUsers fetch:', err)
      }
    })()
  }, [currentOrg?.id])

  const set = (key: keyof TarefaFormValues, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Informe o título da tarefa.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar tarefa.')
    } finally {
      setSaving(false)
    }
  }

  const gridCols = showStatus ? 'grid-cols-3' : 'grid-cols-2'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="Registre tarefas e lembretes internos."
      maxWidth="38rem"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            className="bg-brand-primary! hover:bg-brand-primary/90! text-white!"
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
          >
            {saving ? 'Salvando...' : 'Salvar tarefa'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Erro */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Título */}
        <div className="space-y-1.5">
          <label className={LABEL_CLS}>Título *</label>
          <input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleSave()}
            placeholder="Ex: Checar prazos do processo"
            className={INPUT_CLS}
            style={RING_STYLE}
            autoFocus
          />
        </div>

        {/* Descrição */}
        <div className="space-y-1.5">
          <label className={LABEL_CLS}>Descrição</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            placeholder="Detalhes da tarefa"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none"
            style={RING_STYLE}
          />
        </div>

        {/* Prioridade · (Status) · Prazo */}
        <div className={`grid gap-3 ${gridCols}`}>
          <div className="space-y-1.5">
            <label className={LABEL_CLS}>Prioridade</label>
            <select
              value={form.priority}
              onChange={(e) => set('priority', e.target.value)}
              className={SELECT_CLS}
              style={RING_STYLE}
            >
              <option value="baixa">Baixa</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
            </select>
          </div>

          {showStatus && (
            <div className="space-y-1.5">
              <label className={LABEL_CLS}>Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className={SELECT_CLS}
                style={RING_STYLE}
              >
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className={LABEL_CLS}>Prazo</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => set('dueDate', e.target.value)}
              className={INPUT_CLS}
              style={RING_STYLE}
            />
          </div>
        </div>

        {/* Responsável */}
        <div className="space-y-1.5">
          <label className={LABEL_CLS}>Responsável</label>
          <select
            value={form.ownerId}
            onChange={(e) => set('ownerId', e.target.value)}
            className={SELECT_CLS}
            style={RING_STYLE}
          >
            <option value="">Não atribuído</option>
            {orgUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.nome_completo}</option>
            ))}
          </select>
        </div>

        {/* Vínculo */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={LABEL_CLS}>Vínculo</label>
            <select
              value={form.linkType}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  linkType: e.target.value as LinkType,
                  linkId: '',
                }))
              }
              className={SELECT_CLS}
              style={RING_STYLE}
            >
              <option value="none">Sem vínculo</option>
              <option value="lead">Lead</option>
              <option value="cliente">Cliente</option>
              <option value="caso">Caso</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={LABEL_CLS}>Selecionar</label>
            <select
              value={form.linkId}
              onChange={(e) => set('linkId', e.target.value)}
              disabled={form.linkType === 'none'}
              className={`${SELECT_CLS} disabled:opacity-50 disabled:cursor-not-allowed`}
              style={RING_STYLE}
            >
              <option value="">
                {form.linkType === 'none' ? 'Sem vínculo' : 'Selecione...'}
              </option>

              {form.linkType === 'lead' &&
                leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name}
                  </option>
                ))}

              {form.linkType === 'cliente' &&
                clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.name}
                  </option>
                ))}

              {form.linkType === 'caso' &&
                casos.map((caso) => (
                  <option key={caso.id} value={caso.id}>
                    {caso.numero_processo
                      ? `${caso.numero_processo} — ${caso.title}`
                      : `${caso.title} — ${caso.cliente}`}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>
    </Modal>
  )
}
