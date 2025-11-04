import React from 'react';

/**
 * Componente de Visualização do Relacionamento de Tabelas
 * Mostra a estrutura de relações entre Questões, Simulados, Alternativas e Imagens
 */
export default function RelationshipDiagram() {
  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-2 text-slate-800">🔗 Relacionamento de Tabelas</h1>
      <p className="text-gray-600 mb-8">Visualização das relações entre Questões, Simulados, Alternativas e Imagens</p>

      {/* Seção 1: Visão Geral */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">📊 Visão Geral da Estrutura</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <TableCard name="SIMULADOS" fields={['id_simulado', 'nome', 'descricao', 'ativo']} color="bg-blue-100" />
          <TableCard name="SIMULADO_QUESTOES" fields={['id_simulado', 'id_questao', 'ordem']} color="bg-purple-100" />
          <TableCard name="QUESTOES" fields={['id_questao', 'enunciado', 'dificuldade']} color="bg-green-100" />
          <TableCard name="ALTERNATIVAS" fields={['id_alternativa', 'id_questao', 'letra']} color="bg-yellow-100" />
        </div>
        <TableCard name="IMAGENS" fields={['id_imagem', 'tipo_entidade', 'id_entidade', 'caminho_arquivo']} color="bg-pink-100" />
      </div>

      {/* Seção 2: Relacionamento 1 - Simulado → Questões */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">🔗 Relacionamento 1: SIMULADO ↔ QUESTÕES (M:N)</h2>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
            <h3 className="font-bold text-blue-700 mb-2">SIMULADOS</h3>
            <div className="text-sm">
              <p><span className="text-red-500">PK</span> id_simulado</p>
              <p>nome</p>
              <p>descricao</p>
              <p>data_criacao</p>
              <p>ativo</p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">M:N</div>
              <div className="text-sm text-gray-600">via</div>
              <div className="font-bold text-purple-600">SIMULADO_QUESTOES</div>
            </div>
          </div>

          <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
            <h3 className="font-bold text-green-700 mb-2">QUESTOES</h3>
            <div className="text-sm">
              <p><span className="text-red-500">PK</span> id_questao</p>
              <p>id_tema</p>
              <p>id_prova</p>
              <p>enunciado</p>
              <p>dificuldade</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <h4 className="font-bold mb-2 text-gray-800">Tabela de Junção (SIMULADO_QUESTOES)</h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-bold text-blue-600">id_simulado</p>
              <p className="text-gray-600">Referencia: simulados.id_simulado</p>
            </div>
            <div>
              <p className="font-bold text-green-600">id_questao</p>
              <p className="text-gray-600">Referencia: questoes.id_questao</p>
            </div>
            <div>
              <p className="font-bold">ordem</p>
              <p className="text-gray-600">Posição da questão no simulado</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-100 p-4 rounded-lg text-sm">
          <p className="font-bold mb-2">💡 Exemplo:</p>
          <p>Simulado "ENEM 2023" (id=1) tem 180 questões. A questão 100 é a 5ª questão do simulado.</p>
          <p className="mt-2 font-mono text-xs">INSERT INTO simulado_questoes VALUES (1, 100, 5);</p>
        </div>
      </div>

      {/* Seção 3: Relacionamento 2 - Questão → Alternativas */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-yellow-600">🔗 Relacionamento 2: QUESTÃO ↔ ALTERNATIVAS (1:M)</h2>

        <div className="grid md:grid-cols-2 gap-8 mb-6">
          <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
            <h3 className="font-bold text-green-700 mb-2">QUESTOES</h3>
            <div className="text-sm">
              <p><span className="text-red-500">PK</span> id_questao: 100</p>
              <p>enunciado: "Qual é...?"</p>
              <p>dificuldade: "Fácil"</p>
              <p>tem_imagem: true</p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-2">1:M</div>
              <div className="text-gray-600">Uma questão</div>
              <div className="text-gray-600">tem 5 alternativas</div>
              <div className="font-bold">A, B, C, D, E</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-bold mb-3 text-yellow-700">ALTERNATIVAS relacionadas à questão 100:</h4>
          <div className="grid gap-2">
            <div className="bg-white p-3 rounded border-l-4 border-yellow-400">
              <p className="font-bold">id_alternativa: 401 | letra: A</p>
              <p className="text-gray-600">texto: "Opção A" | correta: false</p>
            </div>
            <div className="bg-white p-3 rounded border-l-4 border-green-500">
              <p className="font-bold">id_alternativa: 402 | letra: B</p>
              <p className="text-gray-600">texto: "Opção B" | correta: true ✓</p>
            </div>
            <div className="bg-white p-3 rounded border-l-4 border-yellow-400">
              <p className="font-bold">id_alternativa: 403 | letra: C</p>
              <p className="text-gray-600">texto: "Opção C" | correta: false</p>
            </div>
            <div className="bg-white p-3 rounded border-l-4 border-yellow-400">
              <p className="font-bold">id_alternativa: 404 | letra: D</p>
              <p className="text-gray-600">texto: "Opção D" | correta: false | tem_imagem: true</p>
            </div>
            <div className="bg-white p-3 rounded border-l-4 border-yellow-400">
              <p className="font-bold">id_alternativa: 405 | letra: E</p>
              <p className="text-gray-600">texto: "Opção E" | correta: false</p>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 4: Relacionamento 3 - Questão → Imagens */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-pink-600">🔗 Relacionamento 3: QUESTÃO ↔ IMAGENS (1:M)</h2>

        <div className="grid md:grid-cols-2 gap-8 mb-6">
          <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
            <h3 className="font-bold text-green-700 mb-2">QUESTOES</h3>
            <div className="text-sm">
              <p><span className="text-red-500">PK</span> id_questao: 100</p>
              <p>enunciado: "Analise o gráfico..."</p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600 mb-2">1:M</div>
              <div className="text-gray-600">Questão pode ter</div>
              <div className="text-gray-600">múltiplas imagens</div>
              <div className="font-bold">Gráficos, tabelas...</div>
            </div>
          </div>
        </div>

        <div className="bg-pink-50 p-4 rounded-lg">
          <h4 className="font-bold mb-3 text-pink-700">IMAGENS de tipo 'questao' com id_entidade=100:</h4>
          <div className="grid gap-2">
            <div className="bg-white p-3 rounded border-l-4 border-pink-400">
              <p className="font-bold">id_imagem: 1001</p>
              <p className="text-sm text-gray-600">tipo_entidade: <span className="bg-pink-100 px-2 py-1 rounded">questao</span></p>
              <p className="text-sm text-gray-600">id_entidade: 100 (questao id)</p>
              <p className="text-sm text-blue-600">caminho: /uploads/questoes/grafico_funcao.png</p>
            </div>
            <div className="bg-white p-3 rounded border-l-4 border-pink-400">
              <p className="font-bold">id_imagem: 1002</p>
              <p className="text-sm text-gray-600">tipo_entidade: <span className="bg-pink-100 px-2 py-1 rounded">questao</span></p>
              <p className="text-sm text-gray-600">id_entidade: 100 (questao id)</p>
              <p className="text-sm text-blue-600">caminho: /uploads/questoes/tabela_dados.png</p>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 5: Relacionamento 4 - Alternativa → Imagens */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-orange-600">🔗 Relacionamento 4: ALTERNATIVA ↔ IMAGENS (1:M)</h2>

        <div className="grid md:grid-cols-2 gap-8 mb-6">
          <div className="border-2 border-yellow-300 rounded-lg p-4 bg-yellow-50">
            <h3 className="font-bold text-yellow-700 mb-2">ALTERNATIVAS</h3>
            <div className="text-sm">
              <p><span className="text-red-500">PK</span> id_alternativa: 404</p>
              <p><span className="text-blue-500">FK</span> id_questao: 100</p>
              <p>letra: "D"</p>
              <p>texto: "Opção D"</p>
              <p>tem_imagem: true</p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-2">1:M</div>
              <div className="text-gray-600">Alternativa pode ter</div>
              <div className="text-gray-600">múltiplas imagens</div>
              <div className="font-bold">Mapa, foto...</div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <h4 className="font-bold mb-3 text-orange-700">IMAGENS de tipo 'alternativa' com id_entidade=404:</h4>
          <div className="grid gap-2">
            <div className="bg-white p-3 rounded border-l-4 border-orange-400">
              <p className="font-bold">id_imagem: 5004</p>
              <p className="text-sm text-gray-600">tipo_entidade: <span className="bg-orange-100 px-2 py-1 rounded">alternativa</span></p>
              <p className="text-sm text-gray-600">id_entidade: 404 (alternativa id)</p>
              <p className="text-sm text-blue-600">caminho: /uploads/alternativas/mapa.png</p>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 6: Tabela Genérica de Imagens */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-indigo-600">🖼️ Tabela Genérica de Imagens</h2>

        <div className="bg-indigo-50 p-6 rounded-lg mb-4">
          <h3 className="font-bold text-indigo-700 mb-4">Estrutura da Tabela IMAGENS</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded border-l-4 border-indigo-400">
              <p className="font-bold text-indigo-600">id_imagem</p>
              <p className="text-sm text-gray-600">Chave primária</p>
            </div>
            <div className="bg-white p-4 rounded border-l-4 border-indigo-400">
              <p className="font-bold text-indigo-600">tipo_entidade</p>
              <p className="text-sm text-gray-600">VARCHAR: 'questao' | 'alternativa' | 'solucao'</p>
            </div>
            <div className="bg-white p-4 rounded border-l-4 border-indigo-400">
              <p className="font-bold text-indigo-600">id_entidade</p>
              <p className="text-sm text-gray-600">ID da questão, alternativa ou solução</p>
            </div>
            <div className="bg-white p-4 rounded border-l-4 border-indigo-400">
              <p className="font-bold text-indigo-600">caminho_arquivo</p>
              <p className="text-sm text-gray-600">URL ou path da imagem</p>
            </div>
          </div>
        </div>

        <div className="bg-indigo-100 p-4 rounded-lg">
          <p className="font-bold mb-2 text-indigo-700">💡 Conceito: Tabela Polimórfica</p>
          <p className="text-sm text-gray-700">
            Uma única tabela armazena imagens de tipos diferentes. O tipo é identificado por:
            <span className="font-mono text-xs bg-white px-2 py-1 rounded ml-2">tipo_entidade</span>
            e o identificador por:
            <span className="font-mono text-xs bg-white px-2 py-1 rounded ml-2">id_entidade</span>
          </p>
          <p className="text-sm text-gray-700 mt-2">
            ✅ Vantagem: Flexibilidade e reutilização de código
          </p>
        </div>
      </div>

      {/* Seção 7: Fluxo Completo */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-violet-600">🔄 Fluxo Completo: Buscar Simulado</h2>

        <div className="space-y-3">
          <FlowStep step={1} title="Usuário seleciona simulado" description="SIMULADOS (id=1)" />
          <FlowStep step={2} title="Sistema busca questões" description="SIMULADO_QUESTOES WHERE id_simulado=1" />
          <FlowStep step={3} title="Busca dados das questões" description="QUESTOES WHERE id_questao IN (...)" />
          <FlowStep step={4} title="Busca alternativas" description="ALTERNATIVAS WHERE id_questao IN (...)" />
          <FlowStep step={5} title="Busca imagens de questões" description="IMAGENS WHERE tipo_entidade='questao' AND id_entidade IN (...)" />
          <FlowStep step={6} title="Busca imagens de alternativas" description="IMAGENS WHERE tipo_entidade='alternativa' AND id_entidade IN (...)" />
          <FlowStep step={7} title="Monta estrutura final" description="JSON com questões, alternativas e imagens" />
        </div>
      </div>

      {/* Seção 8: SQL Prático */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-teal-600">📝 SQL Prático</h2>

        <div className="space-y-4">
          <SQLExample 
            title="Buscar questões de um simulado"
            sql={`SELECT q.* FROM questoes q
INNER JOIN simulado_questoes sq ON q.id_questao = sq.id_questao
WHERE sq.id_simulado = 1
ORDER BY sq.ordem ASC;`}
          />

          <SQLExample 
            title="Questão com suas alternativas"
            sql={`SELECT q.*, 
       json_agg(a.*) as alternativas
FROM questoes q
LEFT JOIN alternativas a ON q.id_questao = a.id_questao
WHERE q.id_questao = 100
GROUP BY q.id_questao;`}
          />

          <SQLExample 
            title="Questão com imagens"
            sql={`SELECT q.*,
       json_agg(i.*) as imagens
FROM questoes q
LEFT JOIN imagens i ON i.tipo_entidade = 'questao' 
                   AND i.id_entidade = q.id_questao
WHERE q.id_questao = 100
GROUP BY q.id_questao;`}
          />
        </div>
      </div>
    </div>
  );
}

interface TableCardProps {
  name: string;
  fields: string[];
  color: string;
}

function TableCard({ name, fields, color }: TableCardProps) {
  return (
    <div className={`${color} rounded-lg p-4 border-2 border-gray-300`}>
      <h3 className="font-bold text-gray-800 mb-2">{name}</h3>
      <ul className="text-xs space-y-1">
        {fields.map((field, idx) => (
          <li key={idx} className="text-gray-700">• {field}</li>
        ))}
      </ul>
    </div>
  );
}

interface FlowStepProps {
  step: number;
  title: string;
  description: string;
}

function FlowStep({ step, title, description }: FlowStepProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-violet-600 text-white font-bold">
          {step}
        </div>
      </div>
      <div className="flex-grow">
        <h3 className="font-bold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600 font-mono">{description}</p>
      </div>
      {step < 7 && <div className="text-2xl text-violet-400">↓</div>}
    </div>
  );
}

interface SQLExampleProps {
  title: string;
  sql: string;
}

function SQLExample({ title, sql }: SQLExampleProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-bold text-teal-600 mb-2">{title}</h4>
      <pre className="bg-slate-900 text-green-400 p-4 rounded text-xs overflow-x-auto">
        <code>{sql}</code>
      </pre>
    </div>
  );
}
