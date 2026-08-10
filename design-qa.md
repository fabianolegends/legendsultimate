# Design QA - Título em duas linhas

- Source visual truth: `/workspace/scratch/7ff5f007655b/upload/82dc1c01-97ba-4f41-8a34-603e63536937.png`
- Implementation route: `/inscricoes#informacoes`
- Desktop combined comparison: `/tmp/legends-design-qa-two-line/comparison-desktop.jpg` no runtime do cloud browser
- Mobile implementation screenshot: `/tmp/legends-design-qa-two-line/implementation-mobile.jpg` no runtime do cloud browser
- Source pixels: 2048 x 1280 px; região de comparação recortada para 2048 x 980 px
- Desktop capture: 1363 x 936 px, viewport de 1363 CSS px, device scale factor 1
- Mobile capture: página responsiva em frame de 390 x 844 CSS px; área útil de conteúdo com 375 px
- State: seção de informações visível e todos os acordeões fechados

## Full-view comparison evidence

A referência anexada, com o título em três linhas, foi colocada ao lado da implementação atual na mesma superfície de comparação. A implementação reduz somente a escala responsiva do título e passa a exibir exatamente duas linhas: “Todas as informações” e “Para decidir.”.

## Focused region evidence

- Desktop: fonte calculada em 69,513 px; a primeira linha mede 592,08 px dentro de uma coluna de 644 px.
- Mobile: fonte calculada em 40 px; a primeira linha mede 340,77 px dentro de uma coluna de 345 px.
- Nos dois tamanhos, o destaque terracota permanece integralmente na segunda linha.
- Mobile sem rolagem horizontal: `scrollWidth` 375 px e `clientWidth` 375 px.

## Required fidelity surfaces

- Fonts and typography: família Barlow Condensed, peso 700, caixa alta, entrelinha e hierarquia foram preservados; somente a escala foi ajustada para controlar a quebra.
- Spacing and layout rhythm: grid, alinhamento, margens e distância para os acordeões permanecem inalterados.
- Colors and visual tokens: preto, creme e terracota continuam usando os tokens existentes.
- Image quality and asset fidelity: nenhuma imagem, logo ou ícone foi alterado.
- Copy and content: o texto permanece “Todas as informações para decidir.”, agora em duas linhas exatas.

## Findings

- Nenhum problema P0, P1 ou P2 foi encontrado.
- Nenhum refinamento P3 necessário nesta iteração.

## Primary interactions tested

- Abrir “Valores e lotes” e confirmar um acordeão aberto.
- Fechar novamente e confirmar zero acordeões abertos.
- Conferir a quebra em duas linhas no desktop e no frame mobile.
- Conferir o console: nenhum erro da aplicação Legends; somente mensagens externas da extensão do Chrome.

## Comparison history

1. Estado anterior: primeira parte do título quebrava em duas linhas, totalizando três linhas visuais.
2. Ajuste: escala máxima desktop reduzida de 78 px para 72 px e escala mobile reduzida de 46 px para 40 px.
3. Pós-ajuste: duas linhas confirmadas por medição e inspeção visual em desktop e mobile, sem overflow.

## Validações técnicas

- `npm run build`: aprovado, incluindo geração estática de `/inscricoes`.
- `git diff --check`: aprovado.

final result: passed
