// Cartão de configuração do PJe/MNI — inserido na aba Avançado da ConfigPage
// Permite ao advogado informar CPF + senha do PJe para ativar:
//   • Consulta completa de processos (partes com nomes via SOAP/MNI)
//   • Listagem de TODOS os processos do advogado (PJe Painel + 28 tribunais)
import * as React from 'react'
import { Scale, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Shield, Download } from 'lucide-react'
import { toast } from 'sonner'

import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Modal }    from '@/components/ui/modal'
import { Badge }    from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn }       from '@/utils/cn'
import { verificarStatus, configurarMNI, submeterOTP } from '@/services/localScraperService'
import { ImportarProcessosPJeModal } from '@/components/ImportarProcessosPJeModal'

// ── Tipos ─────────────────────────────────────────────────────────────────────

type StatusMNI = 'verificando' | 'ativo' | 'inativo' | 'offline'

// ── Componente principal ──────────────────────────────────────────────────────

export function PjeConfigCard() {
  const [modalAberto,       setModalAberto]       = React.useState(false)
  const [importModalAberto, setImportModalAberto]  = React.useState(false)
  const [statusMNI,         setStatusMNI]          = React.useState<StatusMNI>('verificando')
  const [tribunais,         setTribunais]          = React.useState(0)
  const [cpf,               setCpf]               = React.useState('')
  const [senha,             setSenha]             = React.useState('')
  const [mostrarSenha,      setMostrarSenha]      = React.useState(false)
  const [salvando,          setSalvando]          = React.useState(false)
  const [msgResultado,      setMsgResultado]      = React.useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  // 2FA
  const [etapa,             setEtapa]             = React.useState<'formulario' | 'otp'>('formulario')
  const [sessionId,         setSessionId]         = React.useState('')
  const [otpCode,           setOtpCode]           = React.useState('')

  // Verifica status do scraper ao montar e quando o modal fecha
  const verificar = React.useCallback(async () => {
    setStatusMNI('verificando')
    const status = await verificarStatus()
    if (!status?.online) { setStatusMNI('offline'); return }
    setTribunais(status.mni_tribunais ?? 0)
    setStatusMNI(status.mni_configurado ? 'ativo' : 'inativo')
  }, [])

  React.useEffect(() => { verificar() }, [verificar])

  const handleFechar = () => {
    setModalAberto(false)
    setCpf('')
    setSenha('')
    setMsgResultado(null)
    setEtapa('formulario')
    setSessionId('')
    setOtpCode('')
    verificar()
  }

  const handleSalvar = async () => {
    if (!cpf || cpf.replace(/\D/g, '').length < 11) {
      setMsgResultado({ tipo: 'erro', texto: 'Informe um CPF válido (11 dígitos).' })
      return
    }
    if (!senha || senha.length < 4) {
      setMsgResultado({ tipo: 'erro', texto: 'Informe a senha do PJe.' })
      return
    }

    setSalvando(true)
    setMsgResultado(null)

    const resultado = await configurarMNI(cpf, senha)

    setSalvando(false)

    if (resultado.aguardando_otp && resultado.session_id) {
      setSessionId(resultado.session_id)
      setEtapa('otp')
      return
    }

    if (resultado.sucesso) {
      setMsgResultado({ tipo: 'ok', texto: resultado.mensagem })
      toast.success(`PJe configurado — ${resultado.mni_tribunais ?? 0} tribunais disponíveis`)
      setTimeout(handleFechar, 1800)
    } else {
      setMsgResultado({
        tipo:  'erro',
        texto: resultado.erro ?? resultado.mensagem ?? 'Falha ao salvar credenciais.',
      })
    }
  }

  const handleOtp = async () => {
    if (!otpCode || otpCode.replace(/\D/g, '').length < 6) {
      setMsgResultado({ tipo: 'erro', texto: 'Informe o código de 6 dígitos do autenticador.' })
      return
    }
    setSalvando(true)
    setMsgResultado(null)
    const resultado = await submeterOTP(sessionId, otpCode)
    setSalvando(false)

    if (resultado.sucesso) {
      setMsgResultado({ tipo: 'ok', texto: resultado.mensagem })
      toast.success(`PJe configurado — ${resultado.mni_tribunais ?? 0} tribunais disponíveis`)
      setTimeout(handleFechar, 1800)
    } else {
      setMsgResultado({ tipo: 'erro', texto: resultado.erro ?? 'Código inválido.' })
    }
  }

  // Formata CPF enquanto digita: 000.000.000-00
  const handleCpfChange = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11)
    const fmt = d.length <= 3 ? d
      : d.length <= 6 ? `${d.slice(0,3)}.${d.slice(3)}`
      : d.length <= 9 ? `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
      : `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
    setCpf(fmt)
  }

  // ── Badge de status ─────────────────────────────────────────────────────────
  const badgeVariant = statusMNI === 'ativo' ? 'success' : statusMNI === 'offline' ? 'danger' : 'warning'
  const badgeLabel   = statusMNI === 'ativo' ? 'Ativo' : statusMNI === 'offline' ? 'Offline' : statusMNI === 'verificando' ? '…' : 'Não configurado'
  const actionLabel  = statusMNI === 'ativo' ? 'Reconfigurar' : 'Configurar'

  return (
    <>
      {/* ── Card na grid da ConfigPage ───────────────────────────────────── */}
      <Card className="border border-border bg-white/95">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4" style={{ color: '#721011' }} />
              <CardTitle className="text-sm">PJe / MNI</CardTitle>
            </div>
            <Badge variant={badgeVariant}>{badgeLabel}</Badge>
          </div>
          <p className="text-xs text-text-muted">
            Acesso direto ao Painel do Advogado em {tribunais > 0 ? tribunais : 28} tribunais.
            Retorna processos completos com nomes das partes via protocolo MNI.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {statusMNI === 'ativo' && (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Credenciais configuradas — {tribunais} tribunais acessíveis
            </div>
          )}
          {statusMNI === 'offline' && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Scraper server offline — reinicie com <code className="font-mono">npm run dev</code>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={statusMNI === 'offline' || statusMNI === 'verificando'}
              onClick={() => setModalAberto(true)}
              className="bg-brand-primary! text-white! hover:bg-brand-primary/90! border-0!"
            >
              {statusMNI === 'verificando'
                ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Verificando...</>
                : actionLabel}
            </Button>
            {statusMNI === 'ativo' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportModalAberto(true)}
                className="border-brand-primary/30 text-brand-primary hover:bg-brand-primary/5"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Sincronizar processos
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Modal de importação de processos ────────────────────────────── */}
      <ImportarProcessosPJeModal
        open={importModalAberto}
        onClose={() => setImportModalAberto(false)}
      />

      {/* ── Modal de configuração ────────────────────────────────────────── */}
      <Modal
        open={modalAberto}
        onClose={handleFechar}
        title="Configurar PJe / MNI"
        description="Insira as credenciais do advogado no PJe para ativar a consulta de processos."
        footer={
          etapa === 'otp' ? (
            <>
              <Button variant="ghost" onClick={() => { setEtapa('formulario'); setMsgResultado(null) }} disabled={salvando}>
                Voltar
              </Button>
              <Button
                variant="primary"
                onClick={handleOtp}
                disabled={salvando || otpCode.replace(/\D/g, '').length < 6}
                className="bg-brand-primary! hover:bg-brand-primary/90! text-white!"
              >
                {salvando
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verificando...</>
                  : 'Confirmar código'}
              </Button>
            </>
          ) : (
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
          )
        }
      >
        {/* ── Passo: OTP / 2FA ──────────────────────────────────────────── */}
        {etapa === 'otp' ? (
          <div className="space-y-4">
            <div className={cn(
              'flex items-start gap-3 rounded-2xl border px-4 py-3 text-xs',
              'border-brand-primary/30 bg-brand-primary/5 text-brand-primary',
            )}>
              <Shield className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-medium">Autenticação em dois fatores necessária</p>
                <p className="text-brand-primary/80">
                  O PJe exige uma verificação adicional. Abra o aplicativo autenticador (Google Authenticator ou similar) e informe o código de 6 dígitos.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wide text-text-muted">
                Código do autenticador
              </label>
              <Input
                placeholder="000000"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={salvando}
                inputMode="numeric"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && !salvando && handleOtp()}
              />
              <p className="text-[11px] text-text-muted">
                O código tem 6 dígitos e se renova a cada 30 segundos.
              </p>
            </div>

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
          </div>
        ) : (

        <div className="space-y-4">
          {/* Aviso de segurança */}
          <div className={cn(
            'flex items-start gap-3 rounded-2xl border px-4 py-3 text-xs',
            'border-brand-primary/30 bg-brand-primary/5 text-brand-primary',
          )}>
            <Shield className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="font-medium">Credenciais armazenadas localmente</p>
              <p className="text-brand-primary/80">
                Os dados ficam apenas no <code className="font-mono">scraper-server/.env</code> da sua máquina — nunca são enviados para servidores externos.
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
            <p className="text-[11px] text-text-muted">
              O mesmo CPF usado para acessar o PJe no navegador.
            </p>
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wide text-text-muted">
              Senha do PJe
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
              A conexão será testada no TJMG antes de salvar.
            </p>
          </div>

          {/* Resultado do teste */}
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

          {/* Informações técnicas */}
          <div className={cn(
            'rounded-2xl border px-4 py-3 text-[11px] text-text-muted space-y-1',
            'border-border bg-surface',
          )}>
            <p className="font-medium text-text-subtle uppercase tracking-wide">O que será desbloqueado</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Todos os processos do advogado em 28 tribunais PJe</li>
              <li>Nomes completos das partes (polo ativo/passivo)</li>
              <li>Histórico de movimentações processuais</li>
              <li>Enriquecimento automático na análise de CPF (Waze Jurídico)</li>
            </ul>
            <p className="pt-1">
              <span className="font-medium">Tribunais cobertos:</span>{' '}
              TJMG, TJSP¹, TRF3, TRF6, TRT1-3, STJ, TST e outros 20+ com PJe.
            </p>
            <p className="text-[10px] text-text-muted/70">¹ Tribunais sem PJe (ex: TJSP/eSAJ) usam DataJud como fallback.</p>
          </div>
        </div>

        )} {/* fim else etapa === 'formulario' */}
      </Modal>
    </>
  )
}
