---
name: Academic Compliance & Course Specification System
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#444650'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#747781'
  outline-variant: '#c4c6d2'
  surface-tint: '#3e5d9d'
  primary: '#00275f'
  on-primary: '#ffffff'
  primary-container: '#1a3d7c'
  on-primary-container: '#8caaf0'
  inverse-primary: '#afc6ff'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fc'
  on-secondary-container: '#57657a'
  tertiary: '#00301f'
  on-tertiary: '#ffffff'
  tertiary-container: '#004930'
  on-tertiary-container: '#24c189'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#afc6ff'
  on-primary-fixed: '#001944'
  on-primary-fixed-variant: '#234584'
  secondary-fixed: '#d5e3fc'
  secondary-fixed-dim: '#b9c7df'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#3a485b'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a focused, high-precision environment engineered for university faculty, evaluators, and department heads. Drawing inspiration from modern document utilities and technical project management tools, the interface balances institutional authority with the fluid efficiency of contemporary productivity software. 

The aesthetic is utilitarian minimalism: quiet canvases, deliberate typography, and high-legibility spatial discipline. It avoids decorative novelties in favor of content-forward clarity, eliminating friction during dense administrative reviews and complex outcome-mapping workflows. The emotional tone is authoritative, composed, and unburdened—instilling absolute confidence in institutional data integrity.

## Colors

The palette is anchored by an institutional University Blue (`#1a3d7c`), conveying permanence, scholarly tradition, and structural reliability. Interaction states use intentional contrast drops: hover states transition into a deeper `#143063`, while active selections and interactive table rows utilize soft blue washes (`#eff6ff`, `#e0e7ff`).

Surfaces favor clean separation over heavy contrast. The canvas foundation uses Slate-50 (`#f8fafc`), allowing active document sheets and panels in pure white (`#ffffff`) to define natural depth. Structural division is handled strictly by crisp Slate-200 (`#e2e8f0`) perimeter borders.

Text hierarchy is strictly disciplined:
- Primary text: Slate-900 (`#0f172a`) for maximum contrast and legibility across tabular outcomes and syllabus specifications.
- Secondary text: Slate-600 (`#475569`) for metadata, sub-labels, and column descriptions.
- Muted elements: Slate-400 (`#94a3b8`) for placeholder markers, disabled iconography, and inactive indicators.

Semantic governance informs administrative status throughout approval lifecycles:
- Approved / Validated: Emerald (`#10b981`) paired with light green surfaces (`#ecfdf5`).
- In Review / Draft: Amber (`#f59e0b`) paired with warm amber surfaces (`#fffbeb`).
- Returned / Deficient: Rose (`#ef4444`) paired with light red surfaces (`#fef2f2`).

## Typography

The typography uses Inter across all hierarchical roles to sustain optical clarity within complex curriculum documents. With its neutral construction, tall x-height, and precise counters, Inter excels at high-density legibility during extended editorial sessions.

Body text employs generous line-height ratios (1.55x–1.62x) to mitigate visual fatigue across multi-paragraph syllabus descriptions, prerequisite listings, and learning outcome breakdowns. Numeric values, course codes, and curriculum references within tables utilize tabular figure alignments (`tnum`) to maintain vertical scanning discipline. Headings apply subtle negative letter-spacing for structural authority without sacrificing academic sobriety.

## Layout & Spacing

The system adopts a fixed-shell, desktop-first architecture optimized for standard academic workstations and 1366px laptop displays. The outer frame is composed of an immutable 64px fixed Topbar and a 250px fixed vertical navigation Sidebar. 

The primary workspace operates on a fluid layout with an inner content boundary capped at 1080px for standard document editing, expanding dynamically to 100% width with 24px inline gutters when rendering wide multi-column matrices (such as Course Outcome to Program Outcome mapping grids).

Spacing follows a consistent 4px and 8px base rhythm:
- Micro spacing (`space-xs`, `space-sm`) governs internal field padding, tag bounds, and tabular cell offsets.
- Component spacing (`space-md`, `space-lg`) regulates form stack intervals, card insets, and panel splits.
- Section spacing (`space-xl`) isolates discrete evaluation phases, stepper chains, and document segments.

## Elevation & Depth

Visual hierarchy is maintained through structured surface boundaries and low-contrast outlines rather than heavy drop shadows. Layering follows an architectural, flat-sheet philosophy:

- **Base Layer (Canvas):** Set to `#f8fafc`. Houses non-editable canvas territory, outer structural gutters, and global application borders.
- **Surface Layer (Cards, Sheets, Sidebars):** Pure white (`#ffffff`) bounded by a uniform 1px solid `#e2e8f0` stroke. This clean delineation mirrors real-world white paper on a neutral drafting table.
- **Overlay Layer (Dropdowns, Role Selectors, Tooltips):** Pure white surfaces lifted with a quiet ambient shadow (`0 4px 12px -2px rgba(15, 23, 42, 0.08)`), framed by a 1px solid `#cbd5e1` outline to prevent blur bleed onto underlying text blocks.
- **Modal Layer (Critical Workflow Dialogues):** Supported by a muted backdrop wash (`rgba(15, 23, 42, 0.4)`) with an elevation shadow of `0 12px 32px -4px rgba(15, 23, 42, 0.12)`.

## Shapes

The design system implements a soft, disciplined corner profile (`roundedness: 1`). Interactive elements and architectural surfaces carry a baseline radius of 4px (`0.25rem`), preserving structural authority without visual sharpness.

- Standard buttons, input elements, chip badges, and table rows use 4px (`0.25rem`).
- Document panels, upload dropzones, and elevated dialogs scale moderately to 8px (`0.5rem`).
- Circular indicators (status pills, progress step circles, avatar monograms) maintain complete geometry (`rounded-full`) to immediately contrast against rigid structural rectangular frames.

## Components

### Topbar
A rigid 64px structural header spanning the canvas width (`bg-white`, `border-b border-slate-200`). Houses the university/institutional insignia on the left, an inline role-switcher segmented control (Author, Reviewer, HOD) in the center-left, and dynamic document status indicators (e.g., "Draft v2.1 • Unsaved changes") flanked by secondary user actions on the right.

### Navigation Sidebar
A 250px vertical column running flush beneath the topbar (`bg-slate-50`, `border-r border-slate-200`). Navigation links utilize 36px row heights with 8px internal horizontal padding. Active items are defined with a subtle `#eff6ff` background, deep blue `#1a3d7c` text, and a distinct 3px vertical accent indicator along the left border. The workflow follows: Upload, Spec, CO-PO-PSO Map, Checks, Workflow, Export.

### Horizontal Stepper
Positioned above document segments during automated parsing and verification passes. Consists of compact, sequentially connected nodes. Completed steps present solid primary blue circles with check marks; active processing steps pulse softly via an outer `#e0e7ff` halo ring; upcoming steps display subtle Slate-400 outlines with muted typography.

### File Upload Dropzones
Standardized file ingestion blocks featuring a dashed 1.5px border (`border-dashed border-slate-300`). Hover states transition to solid `#1a3d7c` outlines over a light blue wash (`#f8faff`). Accommodates centered cloud upload iconography, explicit format guidelines (PDF, DOCX, CSV), and file item list cards showcasing progress tracks, file weights, and error logs.

### Buttons & Inputs
- **Primary Buttons:** Solid University Blue (`#1a3d7c`) with white text, transitioning to `#143063` on hover. 36px default height, 14px text weight 500, 4px border radius.
- **Secondary Buttons:** Pure white background, 1px border Slate-200 (`#e2e8f0`), text Slate-900. Hover triggers `#f8fafc`.
- **Input Fields:** 36px height, white background, 1px Slate-200 border, inset horizontal padding of 12px. Focus state triggers a clean 1px `#1a3d7c` stroke with a 3px `#eff6ff` focus ring without vertical shift.

### Mapping Matrix Grid (CO-PO-PSO)
Specialized tabular cells for high-density correlation data. Compact 32x32px square inputs embedded directly within border-divided grid rows (`border-slate-200`), featuring rapid keyboard tabulation, instant cell validation cues, and correlation weight tags (1 = Low, 2 = Medium, 3 = High).