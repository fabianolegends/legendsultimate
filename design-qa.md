# Design QA — Programação e hospedagens conveniadas

- Source visual truth: `/workspace/scratch/7ff5f007655b/upload/eeb0fbce-5d66-4012-9a10-afd35762125d.png`
- Implementation route: `/inscricoes#informacoes`
- Desktop capture: cloud browser em 1363 CSS px
- Mobile capture: página responsiva em frame de 390 × 844 CSS px

## Full-view comparison evidence

A estrutura visual do acordeão foi preservada: fundo marfim, cartões claros, faixa terracota com ícone branco, títulos condensados e controle de expansão no lado direito. A nova programação usa a mesma linguagem visual e a nova aba de hospedagens foi inserida imediatamente após ela.

## Focused region evidence

- Sequência final: Valores e lotes; O que está incluído; Kit Premium; Modalidades; Categorias; Etapas; Programação; Regulamento e documentos; Hospedagens conveniadas.
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

---

# Design QA — rodapé global Legends

- Source visual truth: `/workspace/scratch/7ff5f007655b/upload/b4d13f4b-6e90-42a2-b63e-33bad6523b71.png` (2048 × 1280 px).
- Implementation routes: páginas públicas da Legends, com exclusão das áreas operacionais, resultados, eventos e formulários médicos de impressão.
- Desktop capture: cloud browser em 1363 × 936 CSS px, página inicial posicionada no rodapé.
- Estado comparado: rodapé completo, links disponíveis e controle “Topo”.

## Full-view comparison evidence

A referência foi traduzida para a identidade Legends: grande chamada de encerramento em fundo claro, faixa de comunidade, base escura com navegação institucional e linha inferior de utilidades. O terracota, o marfim, o preto e a tipografia condensada preservam os tokens visuais do projeto.

## Focused region evidence

- Chamada final: “A jornada termina. A lenda continua.”
- Faixa de comunidade com acesso funcional às inscrições e à lista prioritária.
- Colunas de navegação para páginas institucionais, documentos, contato e redes sociais.
- Logo oficial da Legends, política de privacidade, preferências de cookies e botão “Topo”.
- Em telas menores, as colunas reorganizam-se em grade de duas colunas; marca e contato ocupam a largura total.

## Interações e rotas

- Botão “Topo”: aprovado; atualiza o hash para `#topo` e retorna a página para `scrollY = 0`.
- Links internos, e-mail, WhatsApp e redes sociais: destinos conferidos.
- Rodapé visível em `/`, `/faq`, `/a-prova`, `/percursos` e `/inscricoes`.
- Rodapé oculto em `/passport`, `/eventos`, `/resultados` e nos formulários médicos destinados à impressão.
- Sem rolagem horizontal no viewport desktop verificado.

## Validações técnicas

- Build de produção com webpack: aprovado; TypeScript aprovado e 83 páginas geradas.
- `git diff --check`: aprovado.
- Nenhum problema P0, P1 ou P2 encontrado.
- Produção não alterada.

final result: passed
