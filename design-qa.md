# Design QA - Inscrições em acordeão

- Source visual truth: `/workspace/scratch/7ff5f007655b/upload/d3783594-be2e-452c-9d1d-65285cf7010a.png`
- Implementation route: `/inscricoes`
- Implementation screenshot: `/tmp/legends-design-qa/implementation-open.png` in the cloud-browser runtime
- Source pixels: 2048 x 1280, including browser chrome
- Implementation capture: desktop cloud-browser viewport, 1363 CSS px wide, device scale factor 1
- State: `Valores e lotes` open; other accordions closed

## Full-view comparison evidence

The source and implementation were both opened and inspected. A normalized combined comparison image could not be created because the cloud browser blocked the local comparison document under its URL security policy. The two captures therefore could not be evaluated in the required single comparison surface.

## Focused region evidence

- The accordion region was captured with `Valores e lotes` open.
- A second interaction check closed the first panel and opened `Modalidades`; the expanded content, minus state, and following row reflow were verified visually.
- No application console errors were observed. Reported console errors came from the browser extension, not the Legends application.
- A true mobile viewport capture was unavailable in the selected cloud browser. Responsive CSS was implemented but not visually verified at the mobile breakpoint.

## Required fidelity surfaces

- Typography: Barlow Condensed hierarchy and Manrope body copy are consistent with the Legends page. Normalized source comparison blocked.
- Spacing and layout: compact 76 px desktop rows, 68 px mobile rows, terracotta icon rail, and controlled 10 px gaps reproduce the reference's accordion rhythm while preserving Legends proportions.
- Colors and tokens: existing Legends cream, black, and terracotta tokens were retained instead of copying the reference's white and orange palette.
- Image and icon fidelity: no raster assets were required. Interface icons use Phosphor outline icons; no handcrafted SVG or CSS icon substitutes were added.
- Copy and content: the existing registration information was preserved and regrouped into five decision-focused accordions. Date, spots, active lot, price, and primary CTA remain visible above the accordion area.

## Findings

- P2 - Normalized visual comparison unavailable. Source and implementation could not be placed into the same browser-rendered comparison surface.
- P2 - Mobile visual verification unavailable. The responsive layout has not been captured at or below 850 CSS px.

## Comparison history

1. Initial build: direct Phosphor imports failed during server-side page-data collection.
2. Fix: icons were isolated in a client boundary. Production build then passed.
3. Interaction check: native details/summary controls opened and closed successfully; open/closed icon states and content reflow were confirmed.

## Primary interactions tested

- Close `Valores e lotes`
- Open `Modalidades`
- Confirm `open` state and expanded body layout
- Confirm plus/minus state change

## Remaining checklist

- Review the deployed branch preview at desktop width.
- Review the deployed branch preview on a real mobile viewport.
- Confirm whether the heading should stay editorial or become closer to the one-line reference title.

final result: blocked
