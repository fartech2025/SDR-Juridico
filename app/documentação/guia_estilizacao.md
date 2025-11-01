# Guia de Estilização (Design System)

Para garantir que novas telas sigam o padrão visual da Landing, use SEMPRE os utilitários e componentes abaixo.

## Princípios
- Use `BasePage` para estruturar páginas.
- Use componentes de UI: `Button`, `Heading`, `Text`, `Card`, `Section`, `Container`.
- Evite cores arbitrárias (`text-[#xxxxxx]`): bloqueadas por lint. Prefira tokens do Tailwind (`text-primary-400`, `bg-surface-900`) ou classes do DS (`ds-*`, `btn-*`).
- Classes globais úteis: `ds-heading`, `ds-muted`, `glass-card`, `container-max`.

## Componentes
- Button: variantes `primary`, `ghost`, `success`; tamanhos `sm|md|lg`.
- Heading: tamanhos `xl|lg|md|sm` (usa `ds-heading`).
- Text: `muted` true/false.
- Card: estilização `glass-card` com `p-6`.
- Section: espaçamento vertical padrão.
- Container: `container-max` centralizado.

## Snippet
No VS Code, use o snippet `newpage` para criar uma página já padronizada.

## Lint e Prettier
- Execução sob demanda:
	- Ordenação de classes: `prettier-plugin-tailwindcss` (format on save no VS Code, se habilitado).
	- Validação de cores arbitrárias: `npm run lint:style` (somente quando o dev quiser).
- Não há mais workflow automático no GitHub para estilo. Rode localmente quando precisar.

## Tailwind Theme
`tailwind.config.js` define `colors.primary|surface|success|warning|error`, `container` e `fontFamily`.

Qualquer exceção visual, documente aqui e crie uma variante no componente correspondente.
