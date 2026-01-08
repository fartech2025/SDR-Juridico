import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface DadosContrato {
  tipoContrato: string
  subtipoContrato: string
  status: string
  numeroContrato: string
  dataEmissao: string
  dataAssinatura: string
  dataInicio: string
  dataTermino: string
  prazoVigencia: string
  renovacaoAutomatica: boolean
  partes: Array<{
    tipo: string
    nome: string
    cpfCnpj: string
    endereco: string
    email: string
    telefone: string
    representante: string
  }>
  objetoContrato: string
  valorTotal: string
  formaPagamento: string
  parcelas: string
  dataVencimento: string
  reajuste: string
  indiceReajuste: string
  honorariosFixo: string
  honorariosExito: string
  percentualExito: string
  valorMinimoGarantido: string
  garantias: string[]
  tipoGarantia: string
  clausulasEspecificas: string
  clausulaRescisao: string
  multaRescisoria: string
  clausulaNaoConcorrencia: string
  sla: string
  escopo: string
  limitesHoras: string
  propriedadeIntelectual: string
  confidencialidade: boolean
  foro: string
  legislacaoAplicavel: string
  tipoAssinatura: string
  assinantes: string
  reconhecimentoFirma: boolean
  cartorio: string
  vinculacaoCliente: string
  vinculacaoCaso: string
  vinculacaoHonorarios: string
  alertaVencimento: boolean
  diasAntesAlerta: string
  alertaReajuste: boolean
  observacoes: string
}

interface FormularioContratoProps {
  dados: DadosContrato
  onChange: (dados: DadosContrato) => void
}

const tiposContrato = [
  { categoria: 'Prestação de Serviços Jurídicos', tipos: [
    'Honorários Advocatícios - Fixo',
    'Honorários Advocatícios - Por Êxito',
    'Honorários Advocatícios - Misto',
    'Honorários Advocatícios - Por Hora',
    'Honorários Advocatícios - Por Demanda',
    'Assessoria Jurídica Mensal - PF',
    'Assessoria Jurídica Mensal - PJ',
    'Assessoria Jurídica - Startups/PMEs',
    'Assessoria Jurídica - Corporativo'
  ]},
  { categoria: 'Contratos Civis', tipos: [
    'Compra e Venda - Imóvel',
    'Compra e Venda - Veículo',
    'Compra e Venda - Bens Móveis',
    'Compra e Venda - Quotas Societárias',
    'Locação - Residencial',
    'Locação - Comercial',
    'Locação - Rural',
    'Locação - Temporada',
    'Comodato - Com Prazo',
    'Comodato - Sem Prazo',
    'Mútuo - Com Juros',
    'Mútuo - Sem Juros',
    'Mútuo - Com Garantia'
  ]},
  { categoria: 'Contratos Empresariais', tipos: [
    'Contrato Social - Constituição',
    'Contrato Social - Alteração',
    'Contrato Social - Entrada/Saída Sócio',
    'Contrato Social - Dissolução',
    'Acordo de Sócios',
    'Parceria Comercial - Distribuição',
    'Parceria Comercial - Representação',
    'Parceria Comercial - Joint Venture',
    'Contrato de Fornecimento - Produtos',
    'Contrato de Fornecimento - Serviços'
  ]},
  { categoria: 'Contratos Trabalhistas', tipos: [
    'Trabalho - CLT Indeterminado',
    'Trabalho - CLT Determinado',
    'Trabalho - Experiência',
    'Prestação Serviços - Autônomo',
    'Prestação Serviços - PJ',
    'Acordo Trabalhista - Extrajudicial',
    'Acordo Trabalhista - Judicial',
    'Termo de Quitação'
  ]},
  { categoria: 'Contratos Digitais', tipos: [
    'Termos de Uso - Web',
    'Termos de Uso - App',
    'Termos de Uso - SaaS',
    'Política de Privacidade - LGPD',
    'Licenciamento Software - Uso',
    'Licenciamento Software - Distribuição',
    'Licenciamento Software - White-label',
    'Desenvolvimento Software'
  ]},
  { categoria: 'Confidencialidade', tipos: [
    'NDA - Unilateral',
    'NDA - Bilateral',
    'NDA - Multilateral',
    'Não Concorrência'
  ]},
  { categoria: 'Contratos Familiares', tipos: [
    'União Estável',
    'Pacto Antenupcial - Separação Total',
    'Pacto Antenupcial - Comunhão Parcial',
    'Pacto Antenupcial - Comunhão Universal',
    'Guarda e Alimentos'
  ]},
  { categoria: 'Contratos Imobiliários', tipos: [
    'Promessa de Compra e Venda',
    'Cessão de Direitos',
    'Incorporação Imobiliária',
    'Loteamento'
  ]},
  { categoria: 'Contratos Financeiros', tipos: [
    'Garantia - Fiança',
    'Garantia - Aval',
    'Garantia - Hipoteca',
    'Garantia - Alienação Fiduciária',
    'Confissão de Dívida'
  ]},
  { categoria: 'Acordos Diversos', tipos: [
    'Acordo Extrajudicial',
    'Termo de Quitação',
    'Termo de Rescisão',
    'TAC - Termo de Ajustamento',
    'Distrato Contratual'
  ]}
]

export function FormularioContrato({ dados, onChange }: FormularioContratoProps) {
  return (
    <div className="space-y-4 mb-4">
      {/* 1) Identificação do Contrato */}
      <Card className="p-4 space-y-4">
        <h3 className="text-base font-semibold text-text border-b border-border pb-2">
          1. Identificação do Contrato
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Tipo de Contrato *</label>
            <select
              value={dados.tipoContrato}
              onChange={(e) => onChange({ ...dados, tipoContrato: e.target.value, subtipoContrato: '' })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecione a categoria</option>
              {tiposContrato.map((cat) => (
                <optgroup key={cat.categoria} label={cat.categoria}>
                  {cat.tipos.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Status</label>
            <select
              value={dados.status}
              onChange={(e) => onChange({ ...dados, status: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="rascunho">Rascunho</option>
              <option value="em_revisao">Em Revisão</option>
              <option value="assinado">Assinado</option>
              <option value="vigente">Vigente</option>
              <option value="encerrado">Encerrado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Número do Contrato</label>
            <input
              type="text"
              value={dados.numeroContrato}
              onChange={(e) => onChange({ ...dados, numeroContrato: e.target.value })}
              placeholder="Ex: CTR/2026/001"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Data de Emissão</label>
            <input
              type="date"
              value={dados.dataEmissao}
              onChange={(e) => onChange({ ...dados, dataEmissao: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Data de Assinatura</label>
            <input
              type="date"
              value={dados.dataAssinatura}
              onChange={(e) => onChange({ ...dados, dataAssinatura: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Data de Início da Vigência</label>
            <input
              type="date"
              value={dados.dataInicio}
              onChange={(e) => onChange({ ...dados, dataInicio: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Data de Término</label>
            <input
              type="date"
              value={dados.dataTermino}
              onChange={(e) => onChange({ ...dados, dataTermino: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Prazo de Vigência</label>
            <input
              type="text"
              value={dados.prazoVigencia}
              onChange={(e) => onChange({ ...dados, prazoVigencia: e.target.value })}
              placeholder="Ex: 12 meses, indeterminado"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="renovacaoAutomatica"
              checked={dados.renovacaoAutomatica}
              onChange={(e) => onChange({ ...dados, renovacaoAutomatica: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="renovacaoAutomatica" className="text-sm font-medium text-text">
              Renovação Automática
            </label>
          </div>
        </div>
      </Card>

      {/* 2) Partes Contratantes */}
      <Card className="p-4 space-y-4">
        <h3 className="text-base font-semibold text-text border-b border-border pb-2">
          2. Partes Contratantes
        </h3>
        
        <div className="space-y-3">
          {dados.partes.map((parte, idx) => (
            <div key={idx} className="border border-border rounded-lg p-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1">Tipo</label>
                  <select
                    value={parte.tipo}
                    onChange={(e) => {
                      const novas = [...dados.partes]
                      novas[idx].tipo = e.target.value
                      onChange({ ...dados, partes: novas })
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecione</option>
                    <option value="contratante">Contratante</option>
                    <option value="contratado">Contratado</option>
                    <option value="interveniente">Interveniente</option>
                    <option value="fiador">Fiador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Nome/Razão Social</label>
                  <input
                    type="text"
                    value={parte.nome}
                    onChange={(e) => {
                      const novas = [...dados.partes]
                      novas[idx].nome = e.target.value
                      onChange({ ...dados, partes: novas })
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">CPF/CNPJ</label>
                  <input
                    type="text"
                    value={parte.cpfCnpj}
                    onChange={(e) => {
                      const novas = [...dados.partes]
                      novas[idx].cpfCnpj = e.target.value
                      onChange({ ...dados, partes: novas })
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Endereço</label>
                  <input
                    type="text"
                    value={parte.endereco}
                    onChange={(e) => {
                      const novas = [...dados.partes]
                      novas[idx].endereco = e.target.value
                      onChange({ ...dados, partes: novas })
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">E-mail</label>
                  <input
                    type="email"
                    value={parte.email}
                    onChange={(e) => {
                      const novas = [...dados.partes]
                      novas[idx].email = e.target.value
                      onChange({ ...dados, partes: novas })
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Telefone</label>
                  <input
                    type="tel"
                    value={parte.telefone}
                    onChange={(e) => {
                      const novas = [...dados.partes]
                      novas[idx].telefone = e.target.value
                      onChange({ ...dados, partes: novas })
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-text-muted mb-1">Representante Legal (se PJ)</label>
                  <input
                    type="text"
                    value={parte.representante}
                    onChange={(e) => {
                      const novas = [...dados.partes]
                      novas[idx].representante = e.target.value
                      onChange({ ...dados, partes: novas })
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              {dados.partes.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ ...dados, partes: dados.partes.filter((_, i) => i !== idx) })}
                  className="text-xs text-red-500"
                >
                  <X className="h-3 w-3 mr-1" /> Remover Parte
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange({ 
              ...dados, 
              partes: [...dados.partes, { tipo: '', nome: '', cpfCnpj: '', endereco: '', email: '', telefone: '', representante: '' }] 
            })}
          >
            + Adicionar Parte
          </Button>
        </div>
      </Card>

      {/* 3) Objeto e Valor */}
      <Card className="p-4 space-y-4">
        <h3 className="text-base font-semibold text-text border-b border-border pb-2">
          3. Objeto e Valor
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-text mb-2">Objeto do Contrato</label>
          <textarea
            value={dados.objetoContrato}
            onChange={(e) => onChange({ ...dados, objetoContrato: e.target.value })}
            rows={4}
            placeholder="Descreva detalhadamente o objeto do contrato"
            className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Valor Total</label>
            <input
              type="text"
              value={dados.valorTotal}
              onChange={(e) => onChange({ ...dados, valorTotal: e.target.value })}
              placeholder="R$ 0,00"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Forma de Pagamento</label>
            <select
              value={dados.formaPagamento}
              onChange={(e) => onChange({ ...dados, formaPagamento: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecione</option>
              <option value="a_vista">À Vista</option>
              <option value="parcelado">Parcelado</option>
              <option value="mensal">Mensal</option>
              <option value="por_etapa">Por Etapa</option>
              <option value="por_hora">Por Hora</option>
              <option value="por_exito">Por Êxito</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Número de Parcelas</label>
            <input
              type="text"
              value={dados.parcelas}
              onChange={(e) => onChange({ ...dados, parcelas: e.target.value })}
              placeholder="Ex: 12x"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Data de Vencimento</label>
            <input
              type="text"
              value={dados.dataVencimento}
              onChange={(e) => onChange({ ...dados, dataVencimento: e.target.value })}
              placeholder="Ex: dia 10 de cada mês"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Campos específicos para honorários */}
        {dados.tipoContrato.includes('Honorários') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Honorários Fixo</label>
              <input
                type="text"
                value={dados.honorariosFixo}
                onChange={(e) => onChange({ ...dados, honorariosFixo: e.target.value })}
                placeholder="R$ 0,00"
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Honorários por Êxito</label>
              <input
                type="text"
                value={dados.honorariosExito}
                onChange={(e) => onChange({ ...dados, honorariosExito: e.target.value })}
                placeholder="R$ 0,00"
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Percentual de Êxito</label>
              <input
                type="text"
                value={dados.percentualExito}
                onChange={(e) => onChange({ ...dados, percentualExito: e.target.value })}
                placeholder="Ex: 30%"
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Valor Mínimo Garantido</label>
              <input
                type="text"
                value={dados.valorMinimoGarantido}
                onChange={(e) => onChange({ ...dados, valorMinimoGarantido: e.target.value })}
                placeholder="R$ 0,00"
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </Card>

      {/* 4) Prazos e Condições */}
      <Card className="p-4 space-y-4">
        <h3 className="text-base font-semibold text-text border-b border-border pb-2">
          4. Prazos e Condições
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Reajuste</label>
            <select
              value={dados.reajuste}
              onChange={(e) => onChange({ ...dados, reajuste: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Sem reajuste</option>
              <option value="anual">Anual</option>
              <option value="semestral">Semestral</option>
              <option value="mensal">Mensal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Índice de Reajuste</label>
            <select
              value={dados.indiceReajuste}
              onChange={(e) => onChange({ ...dados, indiceReajuste: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecione</option>
              <option value="igpm">IGP-M</option>
              <option value="ipca">IPCA</option>
              <option value="inpc">INPC</option>
              <option value="fixo">Percentual Fixo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Tipo de Garantia</label>
            <select
              value={dados.tipoGarantia}
              onChange={(e) => onChange({ ...dados, tipoGarantia: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Sem garantia</option>
              <option value="fiador">Fiador</option>
              <option value="caucao">Caução</option>
              <option value="seguro_fianca">Seguro-Fiança</option>
              <option value="hipoteca">Hipoteca</option>
              <option value="alienacao_fiduciaria">Alienação Fiduciária</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Multa Rescisória</label>
            <input
              type="text"
              value={dados.multaRescisoria}
              onChange={(e) => onChange({ ...dados, multaRescisoria: e.target.value })}
              placeholder="Ex: 30% do valor restante"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Campos para assessoria */}
        {dados.tipoContrato.includes('Assessoria') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text mb-2">Escopo Mensal</label>
              <textarea
                value={dados.escopo}
                onChange={(e) => onChange({ ...dados, escopo: e.target.value })}
                rows={3}
                placeholder="Descreva o escopo de serviços mensais"
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Limites de Horas/Demandas</label>
              <input
                type="text"
                value={dados.limitesHoras}
                onChange={(e) => onChange({ ...dados, limitesHoras: e.target.value })}
                placeholder="Ex: 20h/mês ou 5 demandas/mês"
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">SLA (Tempo de Resposta)</label>
              <input
                type="text"
                value={dados.sla}
                onChange={(e) => onChange({ ...dados, sla: e.target.value })}
                placeholder="Ex: 24h úteis"
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </Card>

      {/* 5) Cláusulas Específicas */}
      <Card className="p-4 space-y-4">
        <h3 className="text-base font-semibold text-text border-b border-border pb-2">
          5. Cláusulas Específicas
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-text mb-2">Cláusulas Específicas</label>
          <textarea
            value={dados.clausulasEspecificas}
            onChange={(e) => onChange({ ...dados, clausulasEspecificas: e.target.value })}
            rows={4}
            placeholder="Digite cláusulas específicas do contrato"
            className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">Cláusula de Rescisão</label>
          <textarea
            value={dados.clausulaRescisao}
            onChange={(e) => onChange({ ...dados, clausulaRescisao: e.target.value })}
            rows={3}
            placeholder="Condições para rescisão do contrato"
            className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">Cláusula de Não Concorrência</label>
          <textarea
            value={dados.clausulaNaoConcorrencia}
            onChange={(e) => onChange({ ...dados, clausulaNaoConcorrencia: e.target.value })}
            rows={2}
            placeholder="Se aplicável, descreva restrições de não concorrência"
            className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {dados.tipoContrato.includes('Desenvolvimento') && (
          <div>
            <label className="block text-sm font-medium text-text mb-2">Propriedade Intelectual</label>
            <textarea
              value={dados.propriedadeIntelectual}
              onChange={(e) => onChange({ ...dados, propriedadeIntelectual: e.target.value })}
              rows={3}
              placeholder="Definição de titularidade da propriedade intelectual"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="confidencialidade"
            checked={dados.confidencialidade}
            onChange={(e) => onChange({ ...dados, confidencialidade: e.target.checked })}
            className="rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="confidencialidade" className="text-sm font-medium text-text">
            Cláusula de Confidencialidade (NDA)
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Foro</label>
            <input
              type="text"
              value={dados.foro}
              onChange={(e) => onChange({ ...dados, foro: e.target.value })}
              placeholder="Ex: Comarca de São Paulo/SP"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Legislação Aplicável</label>
            <input
              type="text"
              value={dados.legislacaoAplicavel}
              onChange={(e) => onChange({ ...dados, legislacaoAplicavel: e.target.value })}
              placeholder="Ex: Legislação brasileira"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </Card>

      {/* 6) Assinaturas e Validade */}
      <Card className="p-4 space-y-4">
        <h3 className="text-base font-semibold text-text border-b border-border pb-2">
          6. Assinaturas e Validade
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Tipo de Assinatura</label>
            <select
              value={dados.tipoAssinatura}
              onChange={(e) => onChange({ ...dados, tipoAssinatura: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecione</option>
              <option value="manuscrita">Manuscrita</option>
              <option value="icp_brasil">ICP-Brasil</option>
              <option value="govbr">Gov.br</option>
              <option value="docusign">DocuSign</option>
              <option value="clicksign">Clicksign</option>
              <option value="outra">Outra Plataforma</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="reconhecimentoFirma"
              checked={dados.reconhecimentoFirma}
              onChange={(e) => onChange({ ...dados, reconhecimentoFirma: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="reconhecimentoFirma" className="text-sm font-medium text-text">
              Reconhecimento de Firma
            </label>
          </div>

          {dados.reconhecimentoFirma && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text mb-2">Cartório</label>
              <input
                type="text"
                value={dados.cartorio}
                onChange={(e) => onChange({ ...dados, cartorio: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text mb-2">Assinantes (nome + qualificação)</label>
            <textarea
              value={dados.assinantes}
              onChange={(e) => onChange({ ...dados, assinantes: e.target.value })}
              rows={3}
              placeholder="Liste todos os assinantes com suas qualificações"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>
      </Card>

      {/* 7) Vinculação e Alertas */}
      <Card className="p-4 space-y-4">
        <h3 className="text-base font-semibold text-text border-b border-border pb-2">
          7. Vinculação e Alertas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Vinculação - Cliente</label>
            <input
              type="text"
              value={dados.vinculacaoCliente}
              onChange={(e) => onChange({ ...dados, vinculacaoCliente: e.target.value })}
              placeholder="ID ou nome do cliente"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Vinculação - Caso</label>
            <input
              type="text"
              value={dados.vinculacaoCaso}
              onChange={(e) => onChange({ ...dados, vinculacaoCaso: e.target.value })}
              placeholder="Número do processo ou caso"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text mb-2">Vinculação - Honorários</label>
            <input
              type="text"
              value={dados.vinculacaoHonorarios}
              onChange={(e) => onChange({ ...dados, vinculacaoHonorarios: e.target.value })}
              placeholder="ID do contrato de honorários vinculado"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="alertaVencimento"
              checked={dados.alertaVencimento}
              onChange={(e) => onChange({ ...dados, alertaVencimento: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="alertaVencimento" className="text-sm font-medium text-text">
              Alerta de Vencimento
            </label>
          </div>

          {dados.alertaVencimento && (
            <div>
              <label className="block text-sm font-medium text-text mb-2">Dias de Antecedência</label>
              <input
                type="number"
                value={dados.diasAntesAlerta}
                onChange={(e) => onChange({ ...dados, diasAntesAlerta: e.target.value })}
                placeholder="Ex: 30"
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="alertaReajuste"
              checked={dados.alertaReajuste}
              onChange={(e) => onChange({ ...dados, alertaReajuste: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="alertaReajuste" className="text-sm font-medium text-text">
              Alerta de Reajuste
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text mb-2">Observações</label>
            <textarea
              value={dados.observacoes}
              onChange={(e) => onChange({ ...dados, observacoes: e.target.value })}
              rows={3}
              placeholder="Observações adicionais sobre o contrato"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
