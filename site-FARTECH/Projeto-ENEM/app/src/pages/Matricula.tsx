import React from 'react';
import BasePage from '../components/BasePage';
import { Link } from 'react-router-dom';

const CAMPOS_IDENTIFICACAO = [
  { label: 'Nome completo', type: 'text', name: 'nome' },
  { label: 'CPF do estudante', type: 'text', name: 'cpf', pattern: '\\d*' },
  { label: 'E-mail responsável', type: 'email', name: 'email' },
  { label: 'Telefone para contato', type: 'tel', name: 'telefone' },
  { label: 'Data de nascimento', type: 'date', name: 'nascimento' },
  { label: 'Série pretendida', type: 'text', name: 'serie' },
];

const CAMPOS_ENDERECO = [
  { label: 'Endereço completo', type: 'text', name: 'endereco' },
  { label: 'Bairro', type: 'text', name: 'bairro' },
  { label: 'Município', type: 'text', name: 'municipio' },
  { label: 'CEP', type: 'text', name: 'cep', pattern: '\\d*' },
];

export default function Matricula() {
  return (
    <BasePage fullWidth contentClassName="py-10">
      <div className="w-full px-4 md:px-8 2xl:px-16 space-y-10">
        <header className="glass-card p-6 md:p-8 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Matrícula Online</p>
              <h1 className="text-3xl font-semibold text-white">Cadastro de alunos da rede municipal</h1>
              <p className="text-slate-400 max-w-3xl mt-2">
                Preencha os campos abaixo para registrar a intenção de vaga. Após o envio, a secretaria entrará em contato
                para validar documentos e confirmar a matrícula.
              </p>
            </div>
            <div className="text-sm text-slate-400">
              Última atualização do fluxo:
              <span className="text-blue-300 font-semibold ml-1">15/11 • 09h22</span>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <form className="glass-card p-6 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Dados do estudante</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {CAMPOS_IDENTIFICACAO.map((campo) => (
                  <label key={campo.name} className="flex flex-col gap-1 text-sm text-slate-300">
                    {campo.label}
                    <input
                      type={campo.type}
                      name={campo.name}
                      pattern={campo.pattern}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-white focus:border-blue-400 focus:outline-none"
                      placeholder={`Informe ${campo.label.toLowerCase()}`}
                    />
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Endereço e unidade</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {CAMPOS_ENDERECO.map((campo) => (
                  <label key={campo.name} className="flex flex-col gap-1 text-sm text-slate-300">
                    {campo.label}
                    <input
                      type={campo.type}
                      name={campo.name}
                      pattern={campo.pattern}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-white focus:border-blue-400 focus:outline-none"
                      placeholder={`Informe ${campo.label.toLowerCase()}`}
                    />
                  </label>
                ))}
                <label className="flex flex-col gap-1 text-sm text-slate-300 md:col-span-2">
                  Escola desejada
                  <select className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-white focus:border-blue-400 focus:outline-none">
                    <option value="">Selecione uma unidade</option>
                    <option>EMEF Aurora</option>
                    <option>EMEF Horizonte</option>
                    <option>EMEF Vale Verde</option>
                  </select>
                </label>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Documentação</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-slate-300">
                  Certidão de nascimento (PDF ou imagem)
                  <input type="file" className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white" />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-300">
                  Comprovante de residência
                  <input type="file" className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white" />
                </label>
              </div>
            </section>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <p className="text-xs text-amber-300 flex-1">
                ⚠️ O botão de envio está desativado enquanto finalizamos a integração com a base da Secretaria.
              </p>
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-slate-500 to-slate-600 px-6 py-3 text-white font-semibold opacity-60 cursor-not-allowed"
              >
                Salvar matrícula
              </button>
            </div>
          </form>

          <aside className="glass-card p-6 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Status</p>
              <h3 className="text-xl font-semibold text-white">Fluxo municipal</h3>
              <p className="text-sm text-slate-400">
                As solicitações são analisadas diariamente pela equipe da Secretaria Municipal de Educação.
              </p>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              {[
                { label: 'Vagas disponíveis', value: '1.284', accent: 'text-emerald-300' },
                { label: 'Solicitações em análise', value: '312', accent: 'text-amber-300' },
                { label: 'Prioridade social', value: '148', accent: 'text-rose-300' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 flex justify-between">
                  <span>{item.label}</span>
                  <span className={`font-semibold ${item.accent}`}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-300">
              <p className="font-semibold text-white mb-2">Dúvidas?</p>
              <p>
                Consulte o{' '}
                <Link to="/documentacao-relacionamentos" className="text-blue-300 underline">
                  guia de matrícula
                </Link>{' '}
                ou entre em contato com a equipe pelo monitor municipal.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </BasePage>
  );
}
