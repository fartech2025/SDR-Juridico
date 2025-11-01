# ENEM App Ultra — UI futurista + Resolvedor com Timer

**Conectado ao schema real do Supabase** (sem views adicionais).
- `usuarios`, `provas`, `questoes`, `alternativas`, `respostas_usuarios`, `resultados_usuarios`, `resultados_por_tema`, `temas`, `solucoes_questoes`.

## Instalação
```bash
npm install
```

## Ambiente
Crie `.env`:
```env
VITE_SUPABASE_URL=https://SEU_PROJECT_URL.supabase.co
VITE_SUPABASE_ANON_KEY=SEU_ANON_KEY
VITE_USER_ID=1
```

## Desenvolvimento
```bash
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## O que há de novo
- **UI futurista** em toda a aplicação (cards glassy, botões limpos).
- **Tela /provas/:ano** com:
  - Menu lateral das questões (status: verde acerto, vermelho erro, laranja pulo, cinza sem resposta).
  - Timer **digital (hh:mm:ss)** de 5h30 para a prova.
  - Enunciado e alternativas A–E com feedback instantâneo.
  - Botões: Anterior, Pular, Próxima, Finalizar Prova.
  - **Autofinalização** quando o tempo acaba, com **Resumo da prova** (acertos, erros, pulos, não respondidas, tempo total).
- **Tudo integrado ao Supabase** com upsert em `respostas_usuarios`.
 
## Mocks (desenvolvimento)

Se você precisa trabalhar offline ou com dados fictícios, existe um mock do Supabase dentro de `app/src/lib/_mocks/mockSupabase.ts`.

Para ativá-lo localmente defina a variável de ambiente `VITE_USE_SUPABASE_MOCK=true` (por exemplo em `.env.local`):

```env
# ative apenas em dev local quando realmente necessário
VITE_USE_SUPABASE_MOCK=true
```

Observação: por padrão a aplicação usa o Supabase real, para evitar o uso acidental de dados fictícios.