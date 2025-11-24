# Fartech Site Institucional

Projeto SvelteKit inspirado em Stripe/Apple para o site institucional da Fartech.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Estrutura

- `src/routes` – páginas (Home, Quem Somos, Serviços e sub-rotas, Cases, Clientes, Blog, Contato).
- `src/lib/components` – componentes reutilizáveis.
- `src/lib/styles/global.css` – tokens, layout e temas.
- `static/images` – assets (substitua `hero-factory.jpg` por uma foto real).

## Deploy AWS Amplify

1. Crie um repositório e publique o projeto.
2. No console AWS → Amplify → **Host Web App**.
3. Conecte o GitHub, selecione o repositório/branch.
4. Amplify detecta SvelteKit e gera o build automático.
5. Opcional: configure domínio via Route 53 e ative SSL.
6. Cada push no branch configurado dispara um novo deploy.

## Checklist de lançamento

- [ ] Ajustar textos finais, cases reais e depoimentos.
- [ ] Substituir imagens placeholder.
- [ ] Validar responsividade (mobile/tablet/desktop).
- [ ] Configurar formulário (Formspree, API própria ou AWS SES).
- [ ] Revisar SEO e acessibilidade.
- [ ] Ativar analytics.
- [ ] Testar pipeline no Amplify.
