import { useState } from 'react'
import { useLeads } from '@/hooks/useLeads'
import { useFont } from '@/contexts/FontContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Trash2, Edit2, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface LeadFilters {
  status:
    | 'todos'
    | 'novo'
    | 'em_contato'
    | 'qualificado'
    | 'proposta'
    | 'ganho'
    | 'perdido'
  heat: 'todos' | 'quente' | 'morno' | 'frio'
}

export function LeadsRealPage() {
  const { leads, loading, error, createLead, updateLead, deleteLead } = useLeads()
  const { fontSize } = useFont()
  const { theme } = useTheme()
  const { orgId } = useCurrentUser()
  
  const [filters, setFilters] = useState<LeadFilters>({
    status: 'todos',
    heat: 'todos',
  })
  
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    origem: '',
    assunto: '',
    status: 'novo' as const,
    heat: 'frio' as const,
  })

  // Filtrar leads
  const filteredLeads = leads.filter((lead) => {
    const statusMatch = filters.status === 'todos' || lead.status === filters.status
    const heatMatch = filters.heat === 'todos' || lead.heat === filters.heat
    return statusMatch && heatMatch
  })

  // Cores para status
  const statusColors: Record<string, string> = {
    novo: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
    em_contato: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    qualificado: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    proposta: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
    ganho: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    perdido: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  }

  // Cores para heat
  const heatColors: Record<string, string> = {
    quente: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    morno: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    frio: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome || !formData.email) {
      toast.error('Preencha nome e email')
      return
    }

    const statusMap: Record<string, string> = {
      novo: 'novo',
      em_contato: 'em_triagem',
      qualificado: 'qualificado',
      proposta: 'qualificado',
      ganho: 'convertido',
      perdido: 'perdido',
    }
    const sqlStatus = statusMap[formData.status] ?? 'novo'

    try {
      if (editingId) {
        await updateLead(editingId, {
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          origem: formData.origem,
          assunto: formData.assunto,
          status: sqlStatus as any,
          qualificacao: { heat: formData.heat },
        })
        toast.success('Lead atualizado!')
      } else {
        if (!orgId) {
          toast.error('Sem org ativa para criar lead')
          return
        }
        await createLead({
          org_id: orgId,
          canal: 'whatsapp',
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          origem: formData.origem,
          assunto: formData.assunto,
          status: sqlStatus as any,
          qualificacao: { heat: formData.heat },
        })
        toast.success('Lead criado!')
      }
      
      setShowForm(false)
      setEditingId(null)
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        origem: '',
        assunto: '',
        status: 'novo',
        heat: 'frio',
      })
    } catch (err) {
      toast.error(editingId ? 'Erro ao atualizar' : 'Erro ao criar')
    }
  }

  const handleEdit = (lead: typeof leads[0]) => {
    setFormData({
      nome: lead.name,
      email: lead.email,
      telefone: lead.phone || '',
      origem: lead.origin || '',
      assunto: lead.area || '',
      status: lead.status as any,
      heat: lead.heat as any,
    })
    setEditingId(lead.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este lead?')) {
      try {
        await deleteLead(id)
        toast.success('Lead deletado!')
      } catch (err) {
        toast.error('Erro ao deletar')
      }
    }
  }

  const isDark = theme === 'dark'
  const bgColor = isDark ? 'bg-slate-950' : 'bg-white'
  const textColor = isDark ? 'text-slate-100' : 'text-slate-900'
  const borderColor = isDark ? 'border-slate-700' : 'border-slate-200'
  const inputBg = isDark ? 'bg-slate-900 text-slate-100 border-slate-700' : 'bg-white text-slate-900 border-slate-300'

  return (
    <div style={{ fontSize: `${fontSize}px` }} className={`${bgColor} ${textColor} min-h-screen p-8`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">📊 Leads</h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            Gerencie seus contatos quentes e qualificados
          </p>
        </div>

        {/* Botão Novo */}
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({
              nome: '',
              email: '',
              telefone: '',
              origem: '',
              assunto: '',
              status: 'novo',
              heat: 'frio',
            })
          }}
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          <Plus size={20} />
          Novo Lead
        </button>

        {/* Formulário */}
        {showForm && (
          <form onSubmit={handleSubmit} className={`mb-8 p-6 border rounded-lg ${borderColor} ${inputBg}`}>
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar' : 'Novo'} Lead</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Nome *"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className={`px-4 py-2 border rounded-lg ${inputBg}`}
              />
              
              <input
                type="email"
                placeholder="Email *"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`px-4 py-2 border rounded-lg ${inputBg}`}
              />
              
              <input
                type="tel"
                placeholder="Telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className={`px-4 py-2 border rounded-lg ${inputBg}`}
              />
              
              <input
                type="text"
                placeholder="Origem"
                value={formData.origem}
                onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
                className={`px-4 py-2 border rounded-lg ${inputBg}`}
              />

              <input
                type="text"
                placeholder="Assunto/Area"
                value={formData.assunto}
                onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                className={`px-4 py-2 border rounded-lg ${inputBg}`}
              />
              
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className={`px-4 py-2 border rounded-lg ${inputBg}`}
              >
                <option value="novo">Novo</option>
                <option value="em_contato">Em Contato</option>
                <option value="qualificado">Qualificado</option>
                <option value="proposta">Proposta</option>
                <option value="ganho">Ganho</option>
                <option value="perdido">Perdido</option>
              </select>
              
              <select
                value={formData.heat}
                onChange={(e) => setFormData({ ...formData, heat: e.target.value as any })}
                className={`px-4 py-2 border rounded-lg ${inputBg}`}
              >
                <option value="quente">🔥 Quente</option>
                <option value="morno">⚠️ Morno</option>
                <option value="frio">❄️ Frio</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                {editingId ? 'Atualizar' : 'Criar'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
                className={`px-4 py-2 border rounded-lg hover:opacity-80 transition ${borderColor}`}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Filtros */}
        <div className="mb-6 flex gap-4 flex-wrap">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
            className={`px-4 py-2 border rounded-lg ${inputBg}`}
          >
            <option value="todos">Todos os Status</option>
            <option value="novo">Novo</option>
            <option value="em_contato">Em Contato</option>
            <option value="qualificado">Qualificado</option>
            <option value="proposta">Proposta</option>
            <option value="ganho">Ganho</option>
            <option value="perdido">Perdido</option>
          </select>
          
          <select
            value={filters.heat}
            onChange={(e) => setFilters({ ...filters, heat: e.target.value as any })}
            className={`px-4 py-2 border rounded-lg ${inputBg}`}
          >
            <option value="todos">Todos os Tipos</option>
            <option value="quente">🔥 Quente</option>
            <option value="morno">⚠️ Morno</option>
            <option value="frio">❄️ Frio</option>
          </select>
        </div>

        {/* Estado de Carregamento */}
        {loading && (
          <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Carregando leads...
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 dark:bg-red-900 dark:border-red-700 dark:text-red-100">
            Erro: {error.message}
          </div>
        )}

        {/* Lista de Leads */}
        {!loading && !error && (
          <>
            <div className={`mb-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
            </div>

            <div className="grid gap-4">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className={`border rounded-lg p-4 hover:shadow-lg transition ${borderColor} ${inputBg}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold">{lead.name}</h3>
                      <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>{lead.email}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(lead)}
                        className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition"
                      >
                        <Edit2 size={18} />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap mb-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${statusColors[lead.status]}`}>
                      {lead.status.replace(/_/g, ' ')}
                    </span>
                    
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${heatColors[lead.heat]}`}>
                      {lead.heat === 'quente' ? '🔥' : lead.heat === 'morno' ? '⚠️' : '❄️'} {lead.heat}
                    </span>
                  </div>

                  {lead.area && (
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      📌 {lead.area}
                    </p>
                  )}

                  {lead.phone && (
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      📞 {lead.phone}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {filteredLeads.length === 0 && (
              <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Nenhum lead encontrado com os filtros selecionados
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
