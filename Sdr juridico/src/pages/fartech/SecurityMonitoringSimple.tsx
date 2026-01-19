import { FartechGuard } from '@/components/guards'

export default function SecurityMonitoringSimple() {
  return (
    <FartechGuard>
      <div className="min-h-screen bg-[#f7f8fc] p-6">
        <h1 className="text-2xl font-bold text-text">
          Painel de Monitoramento de Segurança
        </h1>
        <p className="mt-4 text-text-subtle">
          Teste de segurança funcionando!
        </p>
      </div>
    </FartechGuard>
  )
}
