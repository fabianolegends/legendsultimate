# Design QA - Inscrições em acordeão

- Source visual truth: `/workspace/scratch/7ff5f007655b/upload/e13cf699-4f30-4635-bc31-5e5b5f16588b.png`
- Implementation route: `/inscricoes#informacoes`
- Desktop implementation screenshot: `/tmp/legends-design-qa-v2/implementation-closed.png` in the cloud-browser runtime
- Mobile implementation screenshot: `/tmp/legends-design-qa-v2/implementation-mobile.png` in the cloud-browser runtime
- Combined comparison screenshot: `/tmp/legends-design-qa-v2/comparison-desktop.png` in the cloud-browser runtime
- Source pixels: 2048 x 1280, including browser chrome; the content region was cropped to 2048 x 1111 for comparison
- Desktop capture: 1348 x 926 px at a 1363 CSS px browser viewport, device scale factor 1
- Mobile capture: 390 x 844 CSS px inside the browser-rendered responsive test frame; wrapper capture 1363 x 936 px
- State: all eight accordions closed for the desktop comparison; `Categorias` open for the mobile interaction check

## Full-view comparison evidence

The cropped source and current implementation were rendered together in one browser comparison surface at the same desktop layout state. The implementation preserves the reference's cream background, editorial heading, compact white rows, left color rail, outline icons, small supporting copy, and right-side plus control. The three requested rows were inserted without changing the established hierarchy. The implementation intentionally uses the sampled Legends logo terracotta rather than the previous orange.

## Focused region evidence

- The accordion list was compared with every item closed, matching the compact state shown in the reference.
- The current implementation contains eight rows: Valores e lotes, Modalidades, Categorias, Etapas, Programação, O que está incluído, Kit Premium, and Regulamento e documentos.
- `Categorias` was opened in the 390 px mobile frame. Its two groups remained readable with no horizontal overflow (`scrollWidth` 373 px and `clientWidth` 373 px).
- The mobile heading, summaries, icons, plus/minus state, and expanded content were visually inspected.

## Required fidelity surfaces

- Typography: Barlow Condensed display and UI hierarchy match the existing Legends system and remain visually consistent with the supplied source.
- Spacing and layout: 76 px desktop rows and 68 px mobile rows preserve the compact rhythm. The added rows fit without overlap, clipping, or horizontal overflow.
- Colors and tokens: the accent is `#B96F48` / `rgb(185, 111, 72)`, sampled from `public/legends-logo-official.png`. Icon rails, plus/minus controls, headings, borders, and CTAs use the same token.
- Image and icon fidelity: the existing official Legends logo is preserved. Interface symbols use Phosphor outline icons; no handcrafted SVG, CSS drawing, or placeholder asset was added.
- Copy and content: categories follow the official competitive ranges; stages use the published route metrics and time limits; the programming lists 29 April through 2 May and clearly identifies detailed operational times as pending official publication.

## Findings

- No actionable P0, P1, or P2 visual or interaction issues remain.
- P3: the reference screenshot includes a blue browser focus outline on the last row; it was not reproduced because it is browser state rather than part of the Legends visual system.

## Comparison history

1. Previous pass: only five rows existed, the first item opened by default, the accent used `#C67A3B`, and normalized desktop/mobile comparison was blocked.
2. Fixes: added Categorias, Etapas, and Programação; sampled and applied `#B96F48`; made the initial state fully collapsed; grouped native `details` so only one panel remains open at a time.
3. Post-fix evidence: combined desktop comparison rendered successfully; 390 px mobile layout and expanded category content were captured and inspected.

## Primary interactions tested

- Confirm all eight accordions are closed on initial load.
- Open `Categorias`, then open `Etapas`, and confirm the previous panel closes automatically.
- Open `Programação` and confirm all four dates and routes render.
- Confirm all four stage links point to the corresponding `/percursos/stage-*` page.
- Confirm the computed brand accent is `rgb(185, 111, 72)`.
- Check browser console: no Legends application errors; only unrelated Chrome extension metadata errors were present.

final result: passed
