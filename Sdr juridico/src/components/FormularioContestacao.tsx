import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface DadosContestacao {
  status: string
  numeroProcesso: string
  classeProcessual: string
  varaOrgao: string
  comarca: string
  areaDireito: string
  dataCriacao: string
  dataProtocolo: string
  prazoFinal: string
  situacaoPrazo: string
  autores: Array<{ nome: string; cpfCnpj: string }>
  reus: Array<{ nome: string; cpfCnpj: string }>
  advogadosReu: Array<{ nome: string; oab: string; uf: string }>
  advogadosContrarios: string
  resumoPeticaoInicial: string
  pedidosAutor: string[]
  valorCausa: string
  riscoJuridico: string
  impactoFinanceiro: string
  probabilidadeAcordo: string
  tesePrincipais: string[]
  tesePreliminares: string
  teseMerito: string
  jurisprudencias: Array<{ tribunal: string; numeroProcesso: string; ementa: string }>
  fundamentacaoLegal: string
  pedidosContestacao: string[]
  documentosAnexados: Array<{ tipo: string; origem: string }>
  documentosPendentes: string[]
  validacaoInterna: string
  tipoProvaRequerida: string[]
  testemunhas: Array<{ nome: string; cpf: string; contato: string; observacoes: string }>
  meioProtocolo: string
  numeroProtocolo: string
  comprovanteAnexado: boolean
  confirmacaoProtocolo: boolean
  usuarioProtocolo: string
  dataHoraEnvio: string
}

interface FormularioContestacaoProps {
  dados: DadosContestacao
  onChange: (dados: DadosContestacao) => void
}

export function FormularioContestacao({ dados, onChange }: FormularioContestacaoProps) {
  return (
    <div className="space-y-4 mb-4">
      {/* 1) Identificação rápida */}
      <Card className="p-4 space-y-4">
        <h3 className="text-base font-semibold text-text border-b border-border pb-2">
          1. Identificação Rápida
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Status</label>
            <select
              value={dados.status}
              onChange={(e) => onChange({ ...dados, status: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="rascunho">Rascunho</option>
              <option value="em_revisao">Em Revisão</option>
              <option value="protocolada">Protocolada</option>
              <option value="substituida">Substituída</option>
              <option value="intempestiva">Intempestiva</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Número do Processo (CNJ) *</label>
            <input
              type="text"
              value={dados.numeroProcesso}
              onChange={(e) => onChange({ ...dados, numeroProcesso: e.target.value })}
              placeholder="0000000-00.0000.0.00.0000"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Classe Processual</label>
            <input
              type="text"
              value={dados.classeProcessual}
              onChange={(e) => onChange({ ...dados, classeProcessual: e.target.value })}
              placeholder="Ex: Ação Trabalhista"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Vara / Órgão Julgador</label>
            <input
              type="text"
              value={dados.varaOrgao}
              onChange={(e) => onChange({ ...dados, varaOrgao: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Comarca / Tribunal</label>
            <input
              type="text"
              value={dados.comarca}
              onChange={(e) => onChange({ ...dados, comarca: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Área do Direito</label>
            <input
              type="text"
              value={dados.areaDireito}
              onChange={(e) => onChange({ ...dados, areaDireito: e.target.value })}
              placeholder="cível, trabalhista, previdenciário..."
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Data de Criação</label>
            <input
              type="date"
              value={dados.dataCriacao}
              onChange={(e) => onChange({ ...dados, dataCriacao: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Data de Protocolo</label>
            <input
              type="date"
              value={dados.dataProtocolo}
              onChange={(e) => onChange({ ...dados, dataProtocolo: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Prazo Final</label>
            <input
              type="datetime-local"
              value={dados.prazoFinal}
              onChange={(e) => onChange({ ...dados, prazoFinal: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Situação do Prazo</label>
            <select
              value={dados.situacaoPrazo}
              onChange={(e) => onChange({ ...dados, situacaoPrazo: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="no_prazo">No Prazo</option>
              <option value="urgente">Urgente</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 2) Partes do processo */}
      <Card className="p-4 space-y-4">
        <h3 className="text-base font-semibold text-text border-b border-border pb-2">
          2. Partes do Processo
        </h3>
        
        {/* Autores */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-text">Autor(es)</h4>
          {dados.autores.map((autor, idx) => (
            <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1">Nome</label>
                  <input
                    type="text"
                    value={autor.nome}
                    onChange={(e) => {
                      const novos = [...dados.autores]
                      novos[idx].nome = e.target.value
                      onChange({ ...dados, autores: novos })
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">CPF/CNPJ</label>
                  <input
                    type="text"
                    value={autor.cpfCnpj}
                    onChange={(e) => {
                      const novos = [...dados.autores]
                      novos[idx].cpfCnpj = e.target.value
                      onChange({ ...dados, autores: novos })
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              {dados.autores.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ ...dados, autores: dados.autores.filter((_, i) => i !== idx) })}
                  className="text-xs text-red-500"
                >
                  <X className="h-3 w-3 mr-1" /> Remover
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange({ ...dados, autores: [...dados.autores, { nome: '', cpfCnpj: '' }] })}
          >
            + Adicionar Autor
          </Button>
        </div>

        {/* Réus */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-text">Réu(s)</h4>
          {dados.reus.map((reu, idx) => (
            <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1">Nome</label>
                  <input
                    type="text"
                    value={reu.nome}
                    onChange={(e) => {
                      const novos = [...dados.reus]
                      novos[idx].nome = e.target.value
                      onChange({ ...dados, reus: novos })
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">CPF/CNPJ</label>
                  <input
                    type="text"
                    value={reu.cpfCnpj}
                    onChange={(e) => {
                      const novos = [...dados.reus]
                      novos[idx].cpfCnpj = e.target.value
                      onChange({ ...dados, reus: novos })
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              {dados.reus.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ ...dados, reus: dados.reus.filter((_, i) => i !== idx) })}
                  className="text-xs text-red-500"
                >
                  <X className="h-3 w-3 mr-1" /> Remover
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange({ ...dados, reus: [...dados.reus, { nome: '', cpfCnpj: '' }] })}
          >
            + Adicionar Réu
          </Button>
        </div>

        {/* Advogados do Réu */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-text">Advogado(s) do Réu (interno)</h4>
          {dados.advogadosReu.map((adv, idx) => (
            <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1">Nome</label>
                  <input
                    type="text"
                    value={adv.nome}
                    onChange={(e) => {
                      const novos = [...dados.advogadosReu]
                      novos[idx].nome = e.target.value
                      onChange({ ...dados, advogadosReu: novos })
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">OAB</label>
                  <input
                    type="text"
                    value={adv.oab}
                    onChange={(e) => {
                      const novos = [...dados.advogadosReu]
                      novos[idx].oab = e.target.value
                      onChange({ ...dados, advogadosReu: novos })
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">UF</label>
                  <input
                    type="text"
                    value={adv.uf}
                    onChange={(e) => {
                      const novos = [...dados.advogadosReu]
                      novos[idx].uf = e.target.value
                      onChange({ ...dados, advogadosReu: novos })
                    }}
                    maxLength={2}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              {dados.advogadosReu.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ ...dados, advogadosReu: dados.advogadosReu.filter((_, i) => i !== idx) })}
                  className="text-xs text-red-500"
                >
                  <X className="h-3 w-3 mr-1" /> Remover
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange({ ...dados, advogadosReu: [...dados.advogadosReu, { nome: '', oab: '', uf: '' }] })}
          >
            + Adicionar Advogado
          </Button>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">Advogado(s) da Parte Contrária</label>
          <textarea
            value={dados.advogadosContrarios}
            onChange={(e) => onChange({ ...dados, advogadosContrarios: e.target.value })}
            rows={2}
            placeholder="Informações sobre advogados da parte contrária"
            className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>
      </Card>

      {/* 3) Contexto da demanda */}
      <Card className="p-4 space-y-4">
        <h3 className="text-base font-semibold text-text border-b border-border pb-2">
          3. Contexto da Demanda
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-text mb-2">Resumo da Petição Inicial</label>
          <textarea
            value={dados.resumoPeticaoInicial}
            onChange={(e) => onChange({ ...dados, resumoPeticaoInicial: e.target.value })}
            rows={4}
            placeholder="Descreva os principais pontos da petição inicial"
            className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">Pedidos do Autor</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
            {['Danos morais', 'Horas extras', 'Indenização', 'Obrigação de fazer', 'Rescisão contratual', 'Outros'].map((pedido) => (
              <label key={pedido} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={dados.pedidosAutor.includes(pedido)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange({ ...dados, pedidosAutor: [...dados.pedidosAutor, pedido] })
                    } else {
                      onChange({ ...dados, pedidosAutor: dados.pedidosAutor.filter(p => p !== pedido) })
                    }
                  }}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-text">{pedido}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Valor da Causa</label>
            <input
              type="text"
              value={dados.valorCausa}
              onChange={(e) => onChange({ ...dados, valorCausa: e.target.value })}
              placeholder="R$ 0,00"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Risco Jurídico</label>
            <select
              value={dados.riscoJuridico}
              onChange={(e) => onChange({ ...dados, riscoJuridico: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="baixo">Baixo</option>
              <option value="medio">Médio</option>
              <option value="alto">Alto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Impacto Financeiro Estimado</label>
            <input
              type="text"
              value={dados.impactoFinanceiro}
              onChange={(e) => onChange({ ...dados, impactoFinanceiro: e.target.value })}
              placeholder="R$ 0,00"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Probabilidade de Acordo</label>
            <input
              type="text"
              value={dados.probabilidadeAcordo}
              onChange={(e) => onChange({ ...dados, probabilidadeAcordo: e.target.value })}
              placeholder="Ex: 30%, alta, baixa"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </Card>

      {/* 4) Teses e estratégia de defesa */}
      <Card className="p-4 space-y-4">
        <h3 className="text-base font-semibold text-text border-b border-border pb-2">
          4. Teses e Estratégia de Defesa
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-text mb-2">Teses Principais</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {['Inépcia da inicial', 'Ilegitimidade passiva', 'Prescrição/decadência', 
              'Ausência de prova', 'Mérito improcedente'].map((tese) => (
              <label key={tese} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={dados.tesePrincipais.includes(tese)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange({ ...dados, tesePrincipais: [...dados.tesePrincipais, tese] })
                    } else {
                      onChange({ ...dados, tesePrincipais: dados.tesePrincipais.filter(t => t !== tese) })
                    }
                  }}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-text">{tese}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">Teses Preliminares</label>
          <textarea
            value={dados.tesePreliminares}
            onChange={(e) => onChange({ ...dados, tesePreliminares: e.target.value })}
            rows={3}
            placeholder="Descreva as teses preliminares"
            className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">Tese de Mérito</label>
          <textarea
            value={dados.teseMerito}
            onChange={(e) => onChange({ ...dados, teseMerito: e.target.value })}
            rows={3}
            placeholder="Descreva a tese de mérito"
            className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">Fundamentação Legal</label>
          <textarea
            value={dados.fundamentacaoLegal}
            onChange={(e) => onChange({ ...dados, fundamentacaoLegal: e.target.value })}
            rows={2}
            placeholder="Artigos do CPC/CLT/CC/leis especiais"
            className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">Pedidos da Contestação</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['Improcedência total', 'Improcedência parcial', 'Produção de provas', 
              'Condenação em honorários', 'Outros'].map((pedido) => (
              <label key={pedido} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={dados.pedidosContestacao.includes(pedido)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange({ ...dados, pedidosContestacao: [...dados.pedidosContestacao, pedido] })
                    } else {
                      onChange({ ...dados, pedidosContestacao: dados.pedidosContestacao.filter(p => p !== pedido) })
                    }
                  }}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-text">{pedido}</span>
              </label>
            ))}
          </div>
        </div>
      </Card>

      {/* 5) Provas e documentos */}
      <Card className="p-4 space-y-4">
        <h3 className="text-base font-semibold text-text border-b border-border pb-2">
          5. Provas e Documentos Vinculados
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-text mb-2">Documentos Pendentes (checklist)</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['Contrato', 'Procuração', 'Comprovantes', 'Holerites', 'E-mails', 'Outros'].map((doc) => (
              <label key={doc} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={dados.documentosPendentes.includes(doc)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange({ ...dados, documentosPendentes: [...dados.documentosPendentes, doc] })
                    } else {
                      onChange({ ...dados, documentosPendentes: dados.documentosPendentes.filter(d => d !== doc) })
                    }
                  }}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-text">{doc}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">Validação Interna</label>
          <select
            value={dados.validacaoInterna}
            onChange={(e) => onChange({ ...dados, validacaoInterna: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="pendente">Pendente</option>
            <option value="ok">OK</option>
          </select>
        </div>
      </Card>

      {/* 6) Produção de prova */}
      <Card className="p-4 space-y-4">
        <h3 className="text-base font-semibold text-text border-b border-border pb-2">
          6. Produção de Prova
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-text mb-2">Tipo de Prova Requerida</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['Documental', 'Testemunhal', 'Pericial', 'Depoimento pessoal'].map((tipo) => (
              <label key={tipo} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={dados.tipoProvaRequerida.includes(tipo)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange({ ...dados, tipoProvaRequerida: [...dados.tipoProvaRequerida, tipo] })
                    } else {
                      onChange({ ...dados, tipoProvaRequerida: dados.tipoProvaRequerida.filter(t => t !== tipo) })
                    }
                  }}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-text">{tipo}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Testemunhas */}
        {dados.tipoProvaRequerida.includes('Testemunhal') && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-text">Testemunhas Cadastradas</h4>
            {dados.testemunhas.map((test, idx) => (
              <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Nome</label>
                    <input
                      type="text"
                      value={test.nome}
                      onChange={(e) => {
                        const novas = [...dados.testemunhas]
                        novas[idx].nome = e.target.value
                        onChange({ ...dados, testemunhas: novas })
                      }}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">CPF</label>
                    <input
                      type="text"
                      value={test.cpf}
                      onChange={(e) => {
                        const novas = [...dados.testemunhas]
                        novas[idx].cpf = e.target.value
                        onChange({ ...dados, testemunhas: novas })
                      }}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Contato</label>
                    <input
                      type="text"
                      value={test.contato}
                      onChange={(e) => {
                        const novas = [...dados.testemunhas]
                        novas[idx].contato = e.target.value
                        onChange({ ...dados, testemunhas: novas })
                      }}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Observações</label>
                    <input
                      type="text"
                      value={test.observacoes}
                      onChange={(e) => {
                        const novas = [...dados.testemunhas]
                        novas[idx].observacoes = e.target.value
                        onChange({ ...dados, testemunhas: novas })
                      }}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ ...dados, testemunhas: dados.testemunhas.filter((_, i) => i !== idx) })}
                  className="text-xs text-red-500"
                >
                  <X className="h-3 w-3 mr-1" /> Remover
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange({ 
                ...dados, 
                testemunhas: [...dados.testemunhas, { nome: '', cpf: '', contato: '', observacoes: '' }] 
              })}
            >
              + Adicionar Testemunha
            </Button>
          </div>
        )}
      </Card>

      {/* 7) Protocolo e acompanhamento */}
      <Card className="p-4 space-y-4">
        <h3 className="text-base font-semibold text-text border-b border-border pb-2">
          7. Protocolo e Acompanhamento
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Meio de Protocolo</label>
            <select
              value={dados.meioProtocolo}
              onChange={(e) => onChange({ ...dados, meioProtocolo: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecione</option>
              <option value="pje">PJe</option>
              <option value="esaj">e-SAJ</option>
              <option value="projudi">Projudi</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Número do Protocolo</label>
            <input
              type="text"
              value={dados.numeroProtocolo}
              onChange={(e) => onChange({ ...dados, numeroProtocolo: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="comprovanteAnexado"
              checked={dados.comprovanteAnexado}
              onChange={(e) => onChange({ ...dados, comprovanteAnexado: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="comprovanteAnexado" className="text-sm font-medium text-text">
              Comprovante Anexado (PDF)
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="confirmacaoProtocolo"
              checked={dados.confirmacaoProtocolo}
              onChange={(e) => onChange({ ...dados, confirmacaoProtocolo: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="confirmacaoProtocolo" className="text-sm font-medium text-text">
              Confirmação de Protocolo
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Usuário que Protocolou</label>
            <input
              type="text"
              value={dados.usuarioProtocolo}
              onChange={(e) => onChange({ ...dados, usuarioProtocolo: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Data/Hora Exata do Envio</label>
            <input
              type="datetime-local"
              value={dados.dataHoraEnvio}
              onChange={(e) => onChange({ ...dados, dataHoraEnvio: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
