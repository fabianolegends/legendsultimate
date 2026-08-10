# Design QA - Centralização da chamada final

- Source visual truth: `/workspace/scratch/7ff5f007655b/upload/ef9fb8d2-a35e-4ba6-81fd-53d1bd24e3d2.png`
- Implementation route: `/inscricoes`
- Desktop implementation screenshot: `/tmp/legends-design-qa-final-center/desktop-after.jpg` no runtime do cloud browser
- Mobile implementation screenshot: `/tmp/legends-design-qa-final-center/mobile-after.jpg` no runtime do cloud browser
- Combined before/after comparison: `/tmp/legends-design-qa-final-center/combined-before-after.jpg` no runtime do cloud browser
- Desktop capture: viewport de 1363 CSS px, device scale factor 1
- Mobile capture: página responsiva em frame de 390 x 844 CSS px
- State: chamada final “Não é circuito. É travessia.” visível

## Full-view comparison evidence

A referência anexada e a implementação foram colocadas lado a lado na mesma superfície, com o mesmo viewport interno de 1975 x 754 px. A comparação confirma que o parágrafo, antes deslocado para a esquerda, passou para o mesmo eixo central do título e do botão sem alterar a imagem, a tipografia ou as cores.

## Focused region evidence

- Desktop: shell central em `x = 84 px`, largura `1180 px` e centro `674 px`.
- Desktop: eyebrow, título, parágrafo e botão apresentaram `deltaFromShellCenter = 0 px`.
- Mobile: shell central em `x = 15 px`, largura `360 px` e centro `195 px`.
- Mobile: eyebrow, título, parágrafo e botão apresentaram `deltaFromShellCenter = 0 px`.
- O texto descritivo usa `text-align: center` em ambos os tamanhos e não produz rolagem horizontal.

## Required fidelity surfaces

- Fonts and typography: Barlow Condensed e Manrope preservadas, sem mudança de peso, escala ou entrelinha.
- Spacing and layout rhythm: larguras máximas e espaçamento vertical mantidos; apenas o alinhamento horizontal foi corrigido.
- Colors and visual tokens: preto, creme e terracota continuam usando os tokens existentes.
- Image quality and asset fidelity: imagem de fundo, logo e ícones não foram alterados.
- Copy and content: nenhum texto foi modificado.

## Findings

- Nenhum problema P0, P1 ou P2 encontrado.
- Nenhum refinamento P3 necessário nesta iteração.

## Primary interactions tested

- Abrir “Valores e lotes” e confirmar o estado aberto.
- Fechar novamente e confirmar o estado fechado.
- Conferir a chamada final no desktop e no frame mobile.
- Conferir o console: nenhum erro da aplicação Legends; somente mensagens externas da extensão do Chrome.

## Comparison history

1. Estado anterior: uma regra global mais específica aplicava `margin-left: 0` ao parágrafo final.
2. Ajuste: o shell da chamada passou a centralizar os filhos em grid e o seletor local recebeu escopo suficiente para prevalecer.
3. Pós-ajuste: todos os elementos registraram desvio horizontal de `0 px` no desktop e no mobile.

## Validações técnicas

- `npm run build`: aprovado, incluindo geração estática de `/inscricoes`.
- `git diff --check`: aprovado.

final result: passed
