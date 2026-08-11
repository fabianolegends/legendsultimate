# Design QA — Programação e hospedagens conveniadas

- Source visual truth: `/workspace/scratch/7ff5f007655b/upload/eeb0fbce-5d66-4012-9a10-afd35762125d.png`
- Implementation route: `/inscricoes#informacoes`
- Desktop capture: cloud browser em 1363 CSS px
- Mobile capture: página responsiva em frame de 390 × 844 CSS px

## Full-view comparison evidence

A estrutura visual do acordeão foi preservada: fundo marfim, cartões claros, faixa terracota com ícone branco, títulos condensados e controle de expansão no lado direito. A nova programação usa a mesma linguagem visual e a nova aba de hospedagens foi inserida imediatamente após ela.

## Focused region evidence

- Programação aberta no desktop com cinco dias, começando pelo credenciamento de quarta-feira, 28 de abril.
- Quatro dias de prova apresentam entrega das bags, briefing, largada, resultados e briefing pós-etapa; no último dia, o encerramento substitui o briefing pós-etapa.
- Hospedagens abertas com status de cadastramento e atualização prevista para 15/09/2026.
- Em 390 px, os eventos passam para uma coluna e o acordeão mantém `scrollWidth` e `clientWidth` iguais a `343 px`, sem rolagem horizontal.

## Required fidelity surfaces

- Fonts and typography: Barlow Condensed e Manrope preservadas.
- Spacing and layout rhythm: mesmos cabeçalhos, bordas e intervalos da lista existente.
- Colors and visual tokens: terracota, marfim e preto continuam usando os tokens do projeto.
- Icons: calendário e cama seguem a biblioteca Phosphor já usada pela interface.
- Copy and content: horários e cidades conferidos em desktop e mobile.

## Findings

- Nenhum problema P0, P1 ou P2 encontrado.
- Nenhum refinamento P3 necessário nesta iteração.

## Validações técnicas

- `npm run build`: aprovado, incluindo geração estática de `/inscricoes`.
- Interação dos dois acordeões: aprovada.
- Console da aplicação: sem erros; apenas mensagens da extensão do navegador de QA.
- `git diff --check`: aprovado.

final result: passed
