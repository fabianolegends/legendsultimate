# Design QA - Hero de inscrições

- Source visual truth (estado anterior): `/workspace/scratch/7ff5f007655b/upload/d8d37328-0439-4df5-82af-bb269b7528b6.png`
- Source visual truth (imagem de fundo): `/workspace/scratch/7ff5f007655b/upload/pexels-markusspiske-13799229.jpg`
- Implementation route: `/inscricoes`
- Desktop viewport: 1363 CSS px, device scale factor 1
- Mobile viewport: 390 x 844 CSS px em frame responsivo renderizado pelo navegador
- State: página no topo, hero e navegação visíveis

## Comparação visual

O estado anterior, a implementação atual e a fotografia fornecida foram renderizados juntos numa superfície de comparação no navegador. A implementação preserva a hierarquia editorial da Legends e aplica exatamente a fotografia anexada como fundo do hero, com dois gradientes escuros para manter a leitura do título, do parágrafo e do card de lote.

## Verificações do hero

- A logo oficial permanece no menu com altura controlada de 74 px no desktop e 58 px no mobile, sem corte ou distorção.
- O hero tem 640 px de altura no desktop e passa a ter altura automática no mobile.
- A fotografia otimizada é carregada por `/inscricoes-gravel-forest.webp`, em 2048 x 1365 px.
- O enquadramento mantém o ciclista visível no centro/direita e reserva contraste para o conteúdo à esquerda.
- Os quatro indicadores abaixo do parágrafo foram removidos do DOM; `heroMetaPresent` retornou `false`.
- O card do lote recebeu fundo translúcido e desfoque, preservando contraste sobre a fotografia.

## Responsividade e acessibilidade visual

- No mobile, o hero, a logo, o título e o card cabem sem sobreposição nem rolagem horizontal.
- Medição mobile: `scrollWidth` 373 px para `clientWidth` 373 px.
- O contraste do conteúdo principal foi inspecionado visualmente nos dois tamanhos.
- O tratamento escuro da imagem é intencional para garantir legibilidade do texto branco e do cobre da marca.

## Findings

- Nenhum problema visual ou de interação P0, P1 ou P2 permanece.
- P3: a fotografia é deliberadamente mais escura no hero do que no arquivo original, para proteger a leitura do conteúdo.

## Validações técnicas

- `npx next build`: aprovado, incluindo geração estática de `/inscricoes`.
- `git diff --check`: aprovado.
- Console do navegador: nenhum erro da aplicação Legends; somente mensagens externas de extensões do Chrome.

final result: passed
