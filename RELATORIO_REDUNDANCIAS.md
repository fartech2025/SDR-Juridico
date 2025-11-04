# Relatório de Redundâncias Locais — Projeto-ENEM (03/11/2025)

Este relatório lista redundâncias e pequenos conflitos encontrados no repositório, com recomendações de limpeza e ajustes. Priorizei itens que afetam seu ambiente local (macOS) e a DX (Developer Experience).

## Sumário Rápido
- [x] Tarefas do VS Code duplicadas e Windows-only — corrigido para cross‑platform e removida duplicata.
- [x] Jest: dois arquivos de config (cjs e js) — removido o redundante.
- [x] Arquivo vazio e suspeito `app/npm` — removido.
- [ ] Documentos e relatórios duplicados/antigos — recomendar organizar (não alterado automaticamente).
- [ ] Múltiplas estratégias de deploy (Vercel, Netlify, GitHub Pages) — definir uma principal (não alterado).
- [ ] Componentes de backup `BasePage_backup.tsx` — manter ou arquivar fora de `src`.

## Itens encontrados (detalhado)

### 1) VS Code Tasks (local/macOS)
Arquivo: `.vscode/tasks.json`
- Problemas:
  - Comandos Windows-only (`npx.cmd`, `npm.cmd`, PowerShell) quebravam no macOS.
  - Task "Web: Dev" duplicada (uma sem `cwd`).
- Ações aplicadas:
  - Tornado cross‑platform: `command` padrão usa `npx`/`npm` e defini `windows.command` para `*.cmd`.
  - Para "Types: Generate": usei `bash -lc` no macOS/Linux e mantive o PowerShell no Windows.
  - Removi a task duplicada "Web: Dev".

Impacto: você já pode rodar as tasks em macOS e Windows sem editar manualmente.

### 2) Jest config duplicado
- Arquivos: `app/jest.config.cjs` e `app/jest.config.js`.
- Evidência:
  - `package.json` usa `jest --config jest.config.cjs`.
  - `jest.config.js` referenciava `src/setupTests.ts` (inexistente), indicando obsolescência.
- Ação aplicada: removi `app/jest.config.js`.

### 3) Arquivo residual `app/npm`
- Achado: arquivo vazio chamado `npm` dentro de `app/`.
- Risco: confusão/acidente ao chamar `./npm` ou ruído em listagens.
- Ação aplicada: removi `app/npm`.

### 4) Documentação e relatórios duplicados/antigos
- Exemplos:
  - `README.md` (root) e `README_OLD.md` (root) — manter ambos, mas considere mover o OLD para uma pasta de arquivo.
  - Em `app/`: `README.md` detalhado e `README.txt` mínimo (redundância, considerar remover o `.txt`).
  - Pastas/arquivos em `arquivos_antigos/` duplicam nomes do root (ex.: `vercel.json`), mas o conteúdo já indica "movido" — seguro manter como histórico; recomendo marcar como arquivado.
  - Muitos relatórios JSON de testes (`production_test_report_*`, `stress_test_report_*`, `final_test_report_*`). Sugestão: mover para `reports/` ou adicionar regra no `.gitignore` para snapshots temporários.
- Ação aplicada: não alterei conteúdo de documentação/relatórios para preservar histórico.

### 5) Entradas web duplicadas e múltiplos deploys
- `index.html` no root (landing estática) e `app/index.html` (entrada Vite) — coexistem; recomendado documentar a função de cada uma para evitar confusão ao rodar `npm run dev` no diretório errado.
- Deploy configs:
  - `vercel.json` (root) — válido e aponta para `app/`.
  - `netlify.toml` (root) — coexistente.
  - `_config.yml` (root) — usado por GitHub Pages/Jekyll.
- Recomendação: escolher 1 principal (ex.: Vercel) e mover as alternativas para `infra/deploy-extras/` para reduzir ruído.

### 6) Componentes/Backups dentro de `src`
- `app/src/components/BasePage_backup.tsx` convive com `BasePage.tsx`.
- Recomendação: mover backups para `app/_archive/` ou usar Git para histórico, evitando importações acidentais e peso no bundle de testes/TS.

## Sugestões de próximos passos
- [Opcional] Remover `app/README.txt` (redundante com `README.md`).
- [Opcional] Mover relatórios `*test_report*.json` e similares para `reports/` e ajustar scripts.
- [Opcional] Definir padrão de deploy (ex.: Vercel) e mover configs alternativas para `infra/`.
- [Opcional] Mover `BasePage_backup.tsx` para `_archive/`.

## Anexo — Mudanças aplicadas
- Editado: `.vscode/tasks.json` (cross‑platform, remoção duplicata).
- Removido: `app/jest.config.js` (config redundante).
- Removido: `app/npm` (arquivo vazio).

Se quiser, posso aplicar também as limpezas opcionais acima em um commit separado.
