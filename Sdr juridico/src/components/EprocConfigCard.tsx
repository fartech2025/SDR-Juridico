// Cartão de configuração do eProc — inserido na aba Avançado da ConfigPage
// O eProc usa autenticação própria (PHP), diferente do PJe/Keycloak.
// Por padrão reutiliza as credenciais do PJe. Este card permite configurar
// uma senha diferente quando necessário (EPROC_SENHA no scraper-server/.env).
import * as React from 'react'
import { Scale, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Shield } from 'lucide-react'
import { toast } from 'sonner'

import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Modal }    from '@/components/ui/modal'
import { Badge }    from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn }       from '@/utils/cn'
import { verificarStatus, configurarEproc } from '@/services/localScraperService'

// ── Tipos ─────────────────────────────────────────────────────────────────────

type StatusEproc = 'verificando' | 'ativo' | 'inativo' | 'offline'

// ── Instâncias cobertas ────────────────────────────────────────────────────────

const INSTANCIAS = ['TJMG 1G', 'TJMG 2G', 'TRF4', 'TRF5']

// ── Componente principal ──────────────────────────────────────────────────────

export function EprocConfigCard() {
  const [modalAberto,  setModalAberto]  = React.useState(false)
  const [statusEproc,  setStatusEproc]  = React.useState<StatusEproc>('verificando')
  const [instancias,   setInstancias]   = React.useState(INSTANCIAS.length)
  const [cpf,          setCpf]          = React.useState('')
  const [senha,        setSenha]        = React.useState('')
  const [mostrarSenha, setMostrarSenha] = React.useState(false)
  const [salvando,     setSalvando]     = React.useState(false)
  const [msgResultado, setMsgResultado] = React.useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  const verificar = React.useCallback(async () => {
    setStatusEproc('verificando')
    const status = await verificarStatus()
    if (!status?.online) { setStatusEproc('offline'); return }
    setInstancias(status.eproc_instancias ?? INSTANCIAS.length)
    // eproc_configurado = true quando EPROC_CPF existe OU quando MNI está ativo
    setStatusEproc(status.eproc_configurado ? 'ativo' : 'inativo')
  }, [])

  React.useEffect(() => { verificar() }, [verificar])

  const handleFechar = () => {
    setModalAberto(false)
    setCpf('')
    setSenha('')
    setMsgResultado(null)
    verificar()
  }

  const handleSalvar = async () => {
    if (!cpf || cpf.replace(/\D/g, '').length < 11) {
      setMsgResultado({ tipo: 'erro', texto: 'Informe um CPF válido (11 dígitos).' })
      return
    }
    if (!senha || senha.length < 4) {
      setMsgResultado({ tipo: 'erro', texto: 'Informe a senha do eProc.' })
      return
    }

    setSalvando(true)
    setMsgResultado(null)

    const resultado = await configurarEproc(cpf, senha)
    setSalvando(false)

    if (resultado.sucesso) {
      setMsgResultado({ tipo: 'ok', texto: resultado.mensagem })
      toast.success('eProc configurado — credenciais salvas')
      setTimeout(handleFechar, 1800)
    } else {
      setMsgResultado({
        tipo:  'erro',
        texto: resultado.erro ?? resultado.mensagem ?? 'Falha ao salvar credenciais.',
      })
    }
  }

  const handleCpfChange = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11)
    const fmt = d.length <= 3 ? d
      : d.length <= 6 ? `${d.slice(0,3)}.${d.slice(3)}`
      : d.length <= 9 ? `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
      : `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
    setCpf(fmt)
  }

  const badgeVariant = statusEproc === 'ativo' ? 'success' : statusEproc === 'offline' ? 'danger' : 'warning'
  const badgeLabel   = statusEproc === 'ativo' ? 'Ativo' : statusEproc === 'offline' ? 'Offline' : statusEproc === 'verificando' ? '…' : 'Não configurado'

  return (
    <>
      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <Card className="border border-border bg-white/95">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4" style={{ color: '#721011' }} />
              <CardTitle className="text-sm">eProc</CardTitle>
            </div>
            <Badge variant={badgeVariant}>{badgeLabel}</Badge>
          </div>
          <p className="text-xs text-text-muted">
            Acesso ao Painel do Advogado em {instancias} instâncias eProc
            ({INSTANCIAS.join(', ')}).
            Usa as credenciais do PJe por padrão — configure aqui apenas se a senha for diferente.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {statusEproc === 'ativo' && (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Credenciais configuradas — {instancias} instâncias acessíveis
            </div>
          )}
          {statusEproc === 'inativo' && (
            <div className="flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Configure o PJe/MNI primeiro — o eProc reutiliza as mesmas credenciais.
            </div>
          )}
          {statusEproc === 'offline' && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Scraper server offline — reinicie com <code className="font-mono ml-1">npm run dev</code>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={statusEproc === 'offline' || statusEproc === 'verificando'}
            onClick={() => setModalAberto(true)}
            className="bg-brand-primary! text-white! hover:bg-brand-primary/90! border-0!"
          >
            {statusEproc === 'verificando'
              ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Verificando...</>
              : statusEproc === 'ativo' ? 'Reconfigurar' : 'Configurar senha'}
          </Button>
        </CardContent>
      </Card>

      {/* ── Modal de configuração ─────────────────────────────────────────── */}
      <Modal
        open={modalAberto}
        onClose={handleFechar}
        title="Configurar eProc"
        description="Credenciais de acesso ao Painel do Advogado nas instâncias eProc."
        footer={
          <>
            <Button variant="ghost" onClick={handleFechar} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSalvar}
              disabled={salvando || !cpf || !senha}
              className="bg-brand-primary! hover:bg-brand-primary/90! text-white!"
            >
              {salvando
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Testando conexão...</>
                : 'Testar e Salvar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Aviso */}
          <div className={cn(
            'flex items-start gap-3 rounded-2xl border px-4 py-3 text-xs',
            'border-brand-primary/30 bg-brand-primary/5 text-brand-primary',
          )}>
            <Shield className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="font-medium">Senha independente do PJe</p>
              <p className="text-brand-primary/80">
                Configure aqui apenas se a senha do eProc for diferente da senha do PJe.
                Caso contrário, o sistema já usa as credenciais do PJe automaticamente.
              </p>
            </div>
          </div>

          {/* CPF */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wide text-text-muted">
              CPF do advogado
            </label>
            <Input
              placeholder="000.000.000-00"
              value={cpf}
              onChange={e => handleCpfChange(e.target.value)}
              disabled={salvando}
              inputMode="numeric"
            />
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wide text-text-muted">
              Senha do eProc
            </label>
            <div className="relative">
              <Input
                type={mostrarSenha ? 'text' : 'password'}
                placeholder="••••••••"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                disabled={salvando}
                className="pr-10"
                onKeyDown={e => e.key === 'Enter' && !salvando && handleSalvar()}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                onClick={() => setMostrarSenha(v => !v)}
                tabIndex={-1}
              >
                {mostrarSenha
                  ? <EyeOff className="h-4 w-4" />
                  : <Eye    className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-text-muted">
              O login será testado no TJMG eProc antes de salvar.
            </p>
          </div>

          {/* Resultado */}
          {msgResultado && (
            <div className={cn(
              'flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-xs',
              msgResultado.tipo === 'ok'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200  bg-red-50  text-red-800',
            )}>
              {msgResultado.tipo === 'ok'
                ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                : <AlertCircle  className="h-4 w-4 mt-0.5 shrink-0" />}
              <span>{msgResultado.texto}</span>
            </div>
          )}

          {/* Info técnica */}
          <div className={cn(
            'rounded-2xl border px-4 py-3 text-[11px] text-text-muted space-y-1',
            'border-border bg-surface',
          )}>
            <p className="font-medium text-text-subtle uppercase tracking-wide">Instâncias cobertas</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>TJMG 1G — eproc1g.tjmg.jus.br</li>
              <li>TJMG 2G — eproc2g.tjmg.jus.br</li>
              <li>TRF4 — eproc.trf4.jus.br</li>
              <li>TRF5 — eproc.trf5.jus.br</li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  )
}
