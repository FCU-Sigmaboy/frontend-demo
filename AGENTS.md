# AGENTS.md

## High-Level Objectives

- **Documentation Integrity**: Maintain `README.md` and `AGENTS.md` as the source of truth.
- **Precision**: Execute user requests with high fidelity, ensuring no "catastrophic forgetting".

## Current Session

- **Goal**: Convert `docs/軟體測試專題報告_Sigmaboy.tex` to `docs/軟體測試專題報告_Sigmaboy.html`.
- **Requirements**:
  - A4 PDF print layout.
  - Academic page numbering.
  - Print button in web view.
  - High-fidelity visual matching (Colors, Components, Diagrams).

## Active Tasks

- [x] Create `AGENTS.md` (Self-Correction).
- [x] Plan HTML structure and CSS variables.
- [x] Convert LaTeX content to HTML:
  - [x] Cover Page (with CSS graphics)
  - [x] TOC (Table of Contents)
  - [x] Sections & Text
  - [x] Code Blocks (`codebox`, `lstlisting`)
  - [x] Tables (`longtable`)
  - [x] KPI Cards
  - [x] Diagrams (Pyramid, State Transition) - using SVG
- [x] Verify A4 layout and Print functionality.

## Context & Notes

- Source LaTeX file: `docs/軟體測試專題報告_Sigmaboy.tex`
- Target HTML file: `docs/軟體測試專題報告_Sigmaboy.html`
- Color Palette:
  - NavyBlue: #001F3F
  - ElectricCyan: #39CCCC
  - CoralRed: #FF4136
  - LightGray: #F5F5F5
  - CodeBg: #282C34
  - SuccessGreen: #2ECC40
