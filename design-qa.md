# Design QA - Remoção das métricas duplicadas da Home

- Source visual truth: `/workspace/scratch/7ff5f007655b/upload/6cf0adf5-94fb-4644-b9f2-aff9b75b2729.png`
- Implementation route: `/`
- Desktop implementation screenshot: `/tmp/legends-design-qa-home-summary/desktop-after.png` no runtime do cloud browser
- Mobile implementation screenshot: `/tmp/legends-design-qa-home-summary/mobile-after.png` no runtime do cloud browser
- Desktop capture: viewport de 1363 CSS px
- Mobile capture: página responsiva em frame de 390 x 844 CSS px

## Full-view comparison evidence

A referência mostra dois blocos consecutivos com as mesmas métricas: o quadro grande de quatro colunas e, abaixo, o resumo “Em 30 segundos”. Na implementação final, o primeiro quadro foi removido e o resumo compacto permanece imediatamente após o hero.

## Focused region evidence

- Desktop: nenhuma ocorrência de `.heroStats` e uma ocorrência de `.launchSummary`.
- Desktop: sete itens compactos preservados — data, dias, etapas, distância, ascensão, modalidades e participantes.
- Mobile: nenhuma ocorrência de `.heroStats`, uma ocorrência de `.launchSummary` e sete itens compactos.
- Mobile: o resumo reorganiza os dados em duas colunas, com `scrollWidth` e `clientWidth` iguais a `375 px` na raiz do documento.

## Required fidelity surfaces

- Fonts and typography: Barlow Condensed e Manrope preservadas.
- Spacing and layout rhythm: o resumo ocupa o espaço logo após o hero sem o bloco redundante intermediário.
- Colors and visual tokens: fundo preto, creme e terracota continuam usando os tokens existentes.
- Image quality and asset fidelity: imagem do hero, logo e demais ativos não foram alterados.
- Copy and content: todos os dados do resumo compacto foram preservados.

## Findings

- Nenhum problema P0, P1 ou P2 encontrado.
- Nenhum refinamento P3 necessário nesta iteração.

## Primary checks

- Confirmada a ausência do quadro grande “04 dias / 370,3 quilômetros / 6.302 metros de ascensão / 100 vagas”.
- Confirmada a presença do quadro compacto “O essencial para decidir”.
- Conferidos desktop e mobile sem rolagem horizontal na raiz do documento.

## Validações técnicas

- `npm run build`: aprovado, incluindo geração estática da Home.
- `git diff --check`: aprovado.

final result: passed
