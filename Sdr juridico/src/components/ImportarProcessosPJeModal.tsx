import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle2, AlertCircle, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/utils/cn'
import { listarProcessosAdvogado } from '@/services/localScraperService'
import { importarProcessosSelecionados } from '@/services/pjeImportService'
import { useOrganization } from '@/contexts/OrganizationContext'
import { supabase } from '@/lib/supabaseClient'
import type { ScraperProcesso } from '@/types/caseIntelligence'

interface Props {
  open: boolean
  onClose: () => void
}

type Step = 'carregando' | 'selecao' | 'importando' | 'concluido'

export function ImportarProcessosPJeModal({ open, onClose }: Props) {
  const navigate = useNavigate()
  const { currentOrg } = useOrganization()

  const [step, setStep] = React.useState<Step>('carregando')
  const [processos, setProcessos] = React.useState<ScraperProcesso[]>([])
  const [selecionados, setSelecionados] = React.useState<Set<string>>(new Set())
  const [existentes, setExistentes] = React.useState<Set<string>>(new Set())
  const [erroCarregamento, setErroCarregamento] = React.useState<string | null>(null)
  const [tribunalFiltro, setTribunalFiltro] = React.useState<string>('')
  const [resultado, setResultado] = React.useState<{ criados: number; ignorados: number; erros: number; erroMensagem?: string } | null>(null)

  // Busca processos quando o modal abre
  React.useEffect(() => {
    if (!open) return
    setStep('carregando')
    setProcessos([])
    setSelecionados(new Set())
    setErroCarregamento(null)
    setTribunalFiltro('')
    setResultado(null)

    async function carregar() {
      const orgId = currentOrg?.id
      const [processosResult, existentesResult] = await Promise.all([
        listarProcessosAdvogado(),
        orgId
          ? supabase
              .from('casos')
              .select('numero_processo')
              .eq('org_id', orgId)
              .not('numero_processo', 'is', null)
          : Promise.resolve({ data: [] }),
      ])

      if (processosResult.erro && processosResult.processos.length === 0) {
        setErroCarregamento(processosResult.erro)
        setStep('selecao')
        return
      }

      const existentesSet = new Set<string>(
        ((existentesResult as any).data ?? []).map(
          (r: { numero_processo: string }) => r.numero_processo.replace(/\D/g, '')
        )
      )
      setExistentes(existentesSet)
      setProcessos(processosResult.processos)

      // Pré-seleciona todos os não-existentes
      const novos = processosResult.processos.filter(
        p => !existentesSet.has(p.numero_processo.replace(/\D/g, ''))
      )
      setSelecionados(new Set(novos.map(p => p.numero_processo)))
      setStep('selecao')
    }

    carregar()
  }, [open, currentOrg?.id])

  const processosFiltrados = React.useMemo(() => {
    if (!tribunalFiltro) return processos
    return processos.filter(p => p.tribunal === tribunalFiltro)
  }, [processos, tribunalFiltro])

  const tribunaisDisponiveis = React.useMemo(() => {
    const set = new Set(processos.map(p => p.tribunal))
    return Array.from(set).sort()
  }, [processos])

  const eExistente = (p: ScraperProcesso) =>
    existentes.has(p.numero_processo.replace(/\D/g, ''))

  const handleToggle = (numero: string) => {
    setSelecionados(prev => {
      const next = new Set(prev)
      if (next.has(numero)) next.delete(numero)
      else next.add(numero)
      return next
    })
  }

  const handleSelecionarTodos = () => {
    const novos = processosFiltrados.filter(p => !eExistente(p))
    setSelecionados(prev => {
      const next = new Set(prev)
      novos.forEach(p => next.add(p.numero_processo))
      return next
    })
  }

  const handleDesmarcarTodos = () => {
    const nums = new Set(processosFiltrados.map(p => p.numero_processo))
    setSelecionados(prev => {
      const next = new Set(prev)
      nums.forEach(n => next.delete(n))
      return next
    })
  }

  const selecionadosCount = React.useMemo(
    () => Array.from(selecionados).filter(n => processos.some(p => p.numero_processo === n)).length,
    [selecionados, processos]
  )

  const handleImportar = async () => {
    const orgId = currentOrg?.id
    if (!orgId) {
      setErroCarregamento('Organização não identificada — recarregue a página.')
      return
    }

    setStep('importando')
    const paraImportar = processos.filter(p => selecionados.has(p.numero_processo))
    const res = await importarProcessosSelecionados(paraImportar, orgId)
    setResultado({ criados: res.criados, ignorados: res.ignorados, erros: res.erros, erroMensagem: res.erroMensagem })
    setStep('concluido')
  }

  const existentesCount = processos.filter(p => eExistente(p)).length

  return (
    <Modal
      open={open}
      onClose={step === 'importando' ? () => {} : onClose}
      title="Importar processos do PJe"
      description="Selecione os processos que deseja criar como casos no SDR."
      maxWidth="52rem"
      footer={
        step === 'selecao' ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleImportar}
              disabled={selecionadosCount === 0}
              className="bg-brand-primary! hover:bg-brand-primary/90! text-white!"
            >
              Criar {selecionadosCount > 0 ? `${selecionadosCount} casos` : 'casos'} →
            </Button>
          </>
        ) : step === 'concluido' ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
            <Button
              variant="primary"
              onClick={() => { onClose(); navigate('/app/casos') }}
              className="bg-brand-primary! hover:bg-brand-primary/90! text-white!"
            >
              Ir para Casos
            </Button>
          </>
        ) : undefined
      }
    >
      {/* Estado: carregando */}
      {step === 'carregando' && (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <Loader2 className="h-10 w-10 animate-spin" style={{ color: '#721011' }} />
          <div>
            <p className="font-medium text-text">Buscando processos em 28 tribunais PJe...</p>
            <p className="text-sm text-text-muted mt-1">Isso pode levar até 2 minutos.</p>
          </div>
        </div>
      )}

      {/* Estado: importando */}
      {step === 'importando' && (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <Loader2 className="h-10 w-10 animate-spin" style={{ color: '#721011' }} />
          <p className="font-medium text-text">Criando casos...</p>
        </div>
      )}

      {/* Estado: concluído */}
      {step === 'concluido' && resultado && (
        <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
          {resultado.erros > 0 && resultado.criados === 0
            ? <AlertCircle className="h-12 w-12 text-red-500" />
            : <CheckCircle2 className="h-12 w-12 text-green-500" />}
          <div className="space-y-1">
            <p className="font-semibold text-text text-lg">
              {resultado.criados} {resultado.criados === 1 ? 'caso criado' : 'casos criados'} com sucesso
            </p>
            {resultado.ignorados > 0 && (
              <p className="text-sm text-text-muted">
                {resultado.ignorados} já existiam no SDR e foram ignorados.
              </p>
            )}
            {resultado.erros > 0 && (
              <p className="text-sm text-red-600">
                {resultado.erros} {resultado.erros === 1 ? 'processo falhou' : 'processos falharam'} ao importar.
                {resultado.erroMensagem && (
                  <span className="block text-xs text-red-500 mt-0.5">{resultado.erroMensagem}</span>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Estado: seleção */}
      {step === 'selecao' && (
        <div className="space-y-3">
          {erroCarregamento && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {erroCarregamento}
            </div>
          )}

          {processos.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {processos.length} processos encontrados em {tribunaisDisponiveis.length} tribunais
            </div>
          )}

          {/* Toolbar */}
          {processos.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelecionarTodos}
                className="text-xs h-7 px-2"
              >
                Selecionar todos
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDesmarcarTodos}
                className="text-xs h-7 px-2"
              >
                Desmarcar todos
              </Button>
              <div className="ml-auto flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-text-muted" />
                <select
                  value={tribunalFiltro}
                  onChange={e => setTribunalFiltro(e.target.value)}
                  className={cn(
                    'text-xs rounded-lg border border-border bg-white px-2 py-1',
                    'text-text focus:outline-none focus:ring-2',
                  )}
                  style={{ '--tw-ring-color': 'rgba(114, 16, 17, 0.2)' } as React.CSSProperties}
                >
                  <option value="">Todos os tribunais</option>
                  {tribunaisDisponiveis.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Aviso de já existentes */}
          {existentesCount > 0 && (
            <p className="text-xs text-text-muted">
              ⚠ {existentesCount} {existentesCount === 1 ? 'processo já existe' : 'processos já existem'} no SDR e {existentesCount === 1 ? 'será ignorado' : 'serão ignorados'}.
            </p>
          )}

          {/* Tabela */}
          {processos.length > 0 ? (
            <div className="overflow-auto rounded-xl border border-gray-100 max-h-80">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="w-8 px-3 py-2 text-left" />
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-gray-500 font-medium">Número</th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-gray-500 font-medium">Tribunal</th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-gray-500 font-medium hidden sm:table-cell">Classe</th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-gray-500 font-medium hidden md:table-cell">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {processosFiltrados.map(p => {
                    const existe = eExistente(p)
                    const marcado = selecionados.has(p.numero_processo)
                    return (
                      <tr
                        key={p.numero_processo}
                        onClick={() => !existe && handleToggle(p.numero_processo)}
                        className={cn(
                          'border-t border-gray-100 transition-colors',
                          existe
                            ? 'opacity-40 cursor-not-allowed bg-gray-50'
                            : 'cursor-pointer hover:bg-gray-50',
                          marcado && !existe && 'bg-brand-primary/5',
                        )}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={marcado && !existe}
                            disabled={existe}
                            onChange={() => handleToggle(p.numero_processo)}
                            onClick={e => e.stopPropagation()}
                            className="accent-brand-primary h-3.5 w-3.5"
                            style={{ accentColor: '#721011' }}
                          />
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] text-text whitespace-nowrap">
                          {p.numero_processo}
                        </td>
                        <td className="px-3 py-2 text-text-muted whitespace-nowrap">{p.tribunal}</td>
                        <td className="px-3 py-2 text-text-muted hidden sm:table-cell max-w-[160px] truncate">
                          {p.classe ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-text-muted hidden md:table-cell whitespace-nowrap">
                          {p.data_ajuizamento
                            ? new Date(p.data_ajuizamento).toLocaleDateString('pt-BR')
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            !erroCarregamento && (
              <p className="py-8 text-center text-sm text-text-muted">
                Nenhum processo encontrado nos tribunais PJe configurados.
              </p>
            )
          )}
        </div>
      )}
    </Modal>
  )
}
