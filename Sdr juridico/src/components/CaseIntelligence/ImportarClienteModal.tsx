import { useState, useEffect, useCallback } from 'react'
import { Search, UserPlus, User, X, Check, Loader2 } from 'lucide-react'
import { clientesService } from '@/services/clientesService'
import { toast } from 'sonner'
import type { ClienteRow } from '@/lib/supabaseClient'

interface Props {
  cpf: string
  /** Número do processo a importar (opcional — exibido no modal) */
  numeroProcesso?: string
  tribunal?: string
  onClose: () => void
  /** Chamado com o ID do cliente após importação bem-sucedida */
  onImportado?: (clienteId: string) => void
}

export function ImportarClienteModal({ cpf, numeroProcesso, tribunal, onClose, onImportado }: Props) {
  const [busca, setBusca] = useState('')
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [carregando, setCarregando] = useState(false)
  const [selecionado, setSelecionado] = useState<ClienteRow | null>(null)
  const [importando, setImportando] = useState(false)
  const [modo, setModo] = useState<'buscar' | 'novo'>('buscar')

  const cpfFormatado = cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')

  const buscarClientes = useCallback(async (termo: string) => {
    setCarregando(true)
    try {
      const todos = await clientesService.getClientes()
      const filtrado = termo.trim()
        ? todos.filter(c =>
            c.nome?.toLowerCase().includes(termo.toLowerCase()) ||
            c.cpf?.includes(termo.replace(/\D/g, '')) ||
            c.empresa?.toLowerCase().includes(termo.toLowerCase())
          )
        : todos.slice(0, 10)
      setClientes(filtrado)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    buscarClientes('')
  }, [buscarClientes])

  useEffect(() => {
    const timer = setTimeout(() => buscarClientes(busca), 300)
    return () => clearTimeout(timer)
  }, [busca, buscarClientes])

  async function handleImportar() {
    if (!selecionado) return
    setImportando(true)
    try {
      // Por enquanto, apenas confirmar a vinculação
      // (criação de processo vinculado ao cliente pode ser expandida aqui)
      toast.success(`Processo vinculado ao cliente ${selecionado.nome}`)
      onImportado?.(selecionado.id)
      onClose()
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao importar')
    } finally {
      setImportando(false)
    }
  }

  async function handleCriarNovo() {
    // Navegar para criação de cliente com CPF pré-preenchido
    // Usa localStorage para passar o dado para ClientesPage
    localStorage.setItem('cliente_pre_cpf', cpfFormatado)
    toast.info('Preencha os dados do novo cliente. O CPF já estará preenchido.')
    onClose()
    window.location.href = '/app/clientes?novo=true'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Importar para Cliente</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              CPF {cpfFormatado}
              {numeroProcesso && <> · Processo {numeroProcesso}</>}
              {tribunal && <> · {tribunal}</>}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-gray-100">
          {[
            { key: 'buscar', label: 'Cliente existente', icon: User },
            { key: 'novo',   label: 'Criar novo',        icon: UserPlus },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setModo(key as 'buscar' | 'novo')}
              className={[
                'flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors border-b-2',
                modo === key
                  ? 'border-red-800 text-red-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
              style={modo === key ? { borderColor: '#721011', color: '#721011' } : {}}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {modo === 'buscar' ? (
            <div className="space-y-3">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar cliente por nome ou CPF..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': 'rgba(114, 16, 17, 0.2)' } as any}
                  autoFocus
                />
              </div>

              {/* Lista */}
              <div className="max-h-52 overflow-y-auto space-y-1">
                {carregando ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : clientes.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-6">
                    Nenhum cliente encontrado.{' '}
                    <button onClick={() => setModo('novo')} className="underline" style={{ color: '#721011' }}>
                      Criar novo?
                    </button>
                  </p>
                ) : (
                  clientes.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelecionado(selecionado?.id === c.id ? null : c)}
                      className={[
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                        selecionado?.id === c.id
                          ? 'bg-red-50 border border-red-200'
                          : 'hover:bg-gray-50 border border-transparent',
                      ].join(' ')}
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: '#721011' }}
                      >
                        {c.nome?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.nome}</p>
                        <p className="text-xs text-gray-500">{c.cpf ?? c.cnpj ?? '—'}</p>
                      </div>
                      {selecionado?.id === c.id && (
                        <Check className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: '#721011' }} />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Botão importar */}
              <button
                onClick={handleImportar}
                disabled={!selecionado || importando}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#721011' }}
              >
                {importando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {selecionado ? `Vincular a ${selecionado.nome}` : 'Selecione um cliente'}
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#72101115' }}>
                <UserPlus className="w-6 h-6" style={{ color: '#721011' }} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Criar novo cliente</p>
                <p className="text-xs text-gray-500 mt-1">
                  O formulário será aberto com o CPF <strong>{cpfFormatado}</strong> pré-preenchido.
                </p>
              </div>
              <button
                onClick={handleCriarNovo}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-all"
                style={{ backgroundColor: '#721011' }}
              >
                Abrir formulário de novo cliente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
