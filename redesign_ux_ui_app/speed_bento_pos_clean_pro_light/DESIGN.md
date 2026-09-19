---
name: Speed Bento POS - Clean Pro Light
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
  on-surface-variant: '#3d4a42'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fe932c'
  on-secondary-container: '#663500'
  tertiary: '#b61722'
  on-tertiary: '#ffffff'
  tertiary-container: '#da3437'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.03em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  numeric-lg:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: 0.02em
  numeric-md:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

The design system embodies a modern, clinical, yet energetic operational interface calibrated for fast-paced hospitality environments (POS and KDS). The visual tone bridges systematic productivity with culinary vitality—pairing crisp structural cleanliness with warm, appetite-stimulating accents.

### Visual Style
- **Modern Utilitarianism & Tactile Ergonomics**: High-contrast, clean-surface design with micro-depth and structured information architecture.
- **Atmosphere**: Professional, rapid, calm under high ticket volumes, and ergonomically fail-safe under harsh lighting and rapid touch inputs.
- **Design Metaphor**: A digital bento box—compartmentalized, modular, legible, and uncluttered. Every order item, modifier, and ticket has its discrete visual chamber.

## Colors

The palette balances strict functional ergonomics with culinary warmth. Surfaces remain clean and neutral to prevent eye fatigue during 10-hour shifts, while semantic accents guide quick physical interactions.

### Canvas & Surface Architecture
- **App Background (Base)**: `#f8fafc` (Canvas) transitioning to `#f1f5f9` (Sub-canvas / Rail backdrops).
- **Surface / Cards**: `#ffffff` layered over slate borders (`#e2e8f0`) to provide definitive physical compartmentalization without visual heaviness.
- **Surface Hover / Pressed**: `#f8fafc` on rest, `#f1f5f9` on interaction.

### Text & Contrast Hierarchy
- **Primary Text**: `#0f172a` (Slate 900) achieving WCAG AAA contrast against white cards (>12:1) for rapid scanning of dish names, modifiers, and table numbers.
- **Secondary Text**: `#64748b` (Slate 500) for timestamps, item counts, unit prices, and metadata.
- **Disabled / Structural Border**: `#cbd5e1` to `#e2e8f0`.

### Functional Accents & Semantic Roles
- **Primary Accent (Emerald)**: `#059669` (Dark Emerald) and `#10b981` (Bright Emerald) indicate system validation, fulfilled orders, active checkouts, and successful table seating.
- **Action & Conversion (Amber / Orange)**: `#d97706` and `#f59e0b` reserved strictly for decisive actions: "Send to Kitchen", "Pay Ticket", "Fire Course", and order additions.
- **System States & Timers**:
  - **Urgent / Delayed (`#ef4444`)**: KDS timer exceeding target window (>15m), voided items, cancellations.
  - **Caution / Preparing (`#f59e0b`)**: KDS orders in flight (5–12m), modifiers requiring chef confirmation.
  - **Complete / Ready (`#10b981`)**: Order plated, ready for runner pick-up, bill printed.

## Typography

The design system relies entirely on **Space Grotesk**, exploiting its crisp geometric shapes and distinct technical cadence. Its open apertures and structured glyph shapes provide instant character recognition, even at an arm's distance on counter mounts.

### Tabular Numbers & Financial Data
All pricing, ticket counters, timers, and quantities must enforce `font-feature-settings: "tnum" 1` (tabular numbers) to guarantee stable vertical decimal alignment across dynamic itemized lists and total calculations.

### Hierarchy Guidelines
- **KDS Timers & Quantities**: Rendered in `numeric-lg` or `display-lg` with high-contrast slate or urgent red accents.
- **Dish Names & Titles**: Set in `title-md` or `title-lg` with `fontWeight: 600`.
- **Modifiers & Guest Notes**: Use `body-sm` or `body-md` in Slate 500, with allergy tags bumped to `label-sm` bold.

## Layout & Spacing

The layout is built for multi-column terminal ergonomics, accommodating tablet POS consoles (iPad/Android 10"-12"), fixed counter touchscreens (15"-21"), and wide kitchen display stations (24"-32").

### Touch Target Standard
- **Primary Touch Grid**: All interactive elements (menu item tiles, quantity adjusters, table maps) enforce an absolute minimum target of `48px` × `48px`, ideally `56px` to `64px` on main catalog grids to allow precise tap execution during speed service.

### POS & KDS Viewport Layouts
- **Split POS Architecture (Tablet / Desktop)**:
  - **Left / Center (Catalog & Floor)**: Fluid multi-column grid with 3 to 5 responsive columns of product tiles using `gutter: 1rem`.
  - **Right Panel (Ticket / Cart)**: Fixed width (360px to 420px) sticky sidebar for live order assembly and total calculation.
- **KDS Column Grid**:
  - Horizontal scrolling or wrapping card-column architecture with fixed ticket column widths (280px to 320px) and `space-md` gaps.
- **Mobile Waiter / Handheld**:
  - Single-column stacked layout with safe-area hardware padding, an anchored bottom summary drawer, and oversized sticky action triggers.

## Elevation & Depth

To preserve interface speed and visual clarity in high-glare environments, the system rejects deep shadows in favor of a hybrid **tonal layering + subtle ambient diffusion** approach.

### Depth Hierarchy
- **Level 0 (Floor/Canvas)**: `#f8fafc` or `#f1f5f9`. Recessed, non-interactive backgrounds.
- **Level 1 (Cards, Menu Items, Inactive Tickets)**: `#ffffff` surface with a crisp `1px solid #e2e8f0` border. No shadow or ambient low-opacity shadow (`0 1px 3px 0 rgba(15, 23, 42, 0.04)`).
- **Level 2 (Active Tickets, Selected Products, Dropdowns)**: `#ffffff` with `1px solid #cbd5e1` and a focused ambient shadow: `0 4px 12px -2px rgba(15, 23, 42, 0.08)`.
- **Level 3 (Modals, NumPads, Payment Drawers)**: `#ffffff` with an explicit structural outline and soft depth: `0 12px 28px -4px rgba(15, 23, 42, 0.12)`.
- **Pressed State**: Physical depression simulation—reduces outer shadow to zero and darkens border to `#94a3b8`.

## Shapes

The system uses a balanced rounded shape language (`roundedness: 2` / base `8px`), offering friendly modernism while maximizing high-density real estate for complex food modifier lists.

- **Base Radius (0.5rem / 8px)**: Standard product cards, inputs, ticket items, and operational tags.
- **Large Radius (1rem / 16px)**: Modals, payment bottom-sheets, and KDS ticket containers.
- **Pill (Full Radius / 9999px)**: Status badges (e.g., "Prep", "Ready", "Dine-In") and segmented mode toggles.

## Components

### Buttons & Touch Triggers
- **Primary CTA ("Send", "Charge")**: Background `#d97706` (or `#059669` for pure completions), text `#ffffff`, bold tabular numbers, minimum height `52px`, `rounded-md`. Active state shifts down 1px with background darkening.
- **Secondary Actions ("Hold", "Split", "Discount")**: White background, `1px solid #e2e8f0`, text `#0f172a`, with hover state `#f8fafc`.
- **Destructive / Void ("Cancel Order")**: Soft red tint `#fef2f2`, text `#ef4444`, active border `#fca5a5`.

### Menu Item Card (Catalog)
- Card container with `#ffffff` surface, `1px solid #e2e8f0`, and `rounded-md` radius.
- Padding of `12px` (dense) to `16px` (comfortable).
- Header with dish name in `title-md` (`#0f172a`), bottom price badge in bold tabular emerald (`#059669`), and optional stock count pill top-right.

### KDS Ticket Container
- Header bar color-coded by dynamic threshold:
  - Fresh order (<5m): Slate header (`#f1f5f9` with `#0f172a` text).
  - Approaching limit (5-15m): Amber header (`#fef3c7` with `#92400e` text).
  - Delayed (>15m): Pulsing urgent red banner (`#fee2e2` with `#991b1b` text).
- Content: List of items with `body-md`, bold prefix quantity `[ 2x ]`, and indented italic modifiers in Slate 500 (`#64748b`).

### Chips & Modifiers
- Inactive modifier: `#f1f5f9` background, `#475569` text, `rounded-full`, 8px horizontal padding.
- Selected modifier: Emerald tint `#ecfdf5`, border `1px solid #10b981`, text `#065f46`.
- Omission modifier ("NO Onions"): Red tint `#fef2f2`, border `1px solid #f87171`, text `#991b1b`.

### Numeric Keypad (NumPad)
- Oversized touch grid: 3 columns × 4 rows.
- Each key: Minimum `60px` height, `#ffffff` surface, `1px solid #e2e8f0`, font size `22px` tabular bold.
- Fast feedback: Instant background switch to `#e2e8f0` upon touch touch-down with zero transition delay.

### Form Inputs & Barcode Fields
- White background, `1.5px solid #cbd5e1`, 48px height, `space-lg` horizontal padding.
- Focus state: Ring `2px solid #059669` with offset `1px`.