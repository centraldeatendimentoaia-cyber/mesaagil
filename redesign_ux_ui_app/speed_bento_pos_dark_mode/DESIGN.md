---
name: Speed Bento POS
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#68dba9'
  on-secondary: '#003825'
  secondary-container: '#25a475'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#e29100'
  on-tertiary-container: '#523200'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.02em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style
The design system targets high-turnover restaurant environments—buzzy bistros, quick-service counters, and floor servers operating hand-held terminals under varying ambient light conditions. The emotional response must balance rapid operational confidence, surgical precision, and low-friction haptic reassurance. Every action in this workflow represents an immediate physical transaction; therefore, the system prioritizes instantaneous recognition over decorative flourish.

The visual style blends **Dark Modern Bento** structure with **Tactile/Skeuomorphic micro-affordances**. Information is segmented into dense, self-contained modular cells that eliminate visual wandering. Interactive components emulate calibrated hardware toggles and mechanical micro-switches: buttons exhibit shallow top-down lighting, depressed states sink by sub-pixel offsets, and critical action nodes radiate authoritative emerald luminescence against a deep charcoal field.

## Colors
The palette is built upon deep slate-charcoal neutrals to reduce battery consumption on OLED mobile POS hardware and prevent eye fatigue during long shifts in dim dining rooms. 

- **Primary (`#10B981`) & Secondary (`#059669`):** Function as the confirmation engine. This emerald spectrum represents validated actions, successful payments, and actionable checkout controls. It pierces dark backgrounds with high luminance contrast, exceeding WCAG AAA standards for legibility.
- **Tertiary (`#F59E0B`):** Reserved strictly for urgent overrides, tip modifiers, alert states, and split-tender balances pending resolution.
- **Surface Neutrals (`#0F172A`, `#1E293B`, `#334155`):** Form the bento foundation. Deepest base (`#0F172A`) anchors the canvas, mid-tier slate (`#1E293B`) forms distinct tile containers, and elevated slate (`#334155`) marks inset troughs, dividers, and inactive borders.
- **Text Neutrals:** Primary text uses crisp high-contrast off-white (`#F8FAFC`), while secondary meta-information rests at muted slate (`#94A3B8`).

## Typography
Typography is split into three functional disciplines:
1. **Space Grotesk (Headlines & Totals):** Delivers clean, geometric tension suited for large order totals, table IDs, and workflow state headers. Its wide stance prevents visual collapse at quick glance.
2. **Hanken Grotesk (Body & Line Items):** Modern, unadorned humanist grotesk delivering instant recognition for item names, modifiers, customer dietary notes, and system instructions.
3. **JetBrains Mono (Labels, Currency & Modifiers):** The technical backbone. Used for exact currency denominations, split ratios, seat designations, quantity steppers, and timestamps. Monospaced tabular figures ensure numbers do not jitter during real-time total recalculations.

## Layout & Spacing
The layout employs an asymmetric **Mobile Bento Grid** engineered specifically for single-handed thumb-reach zones or dual-hand terminal cradling.

- **Grid Mechanics:** Mobile operates on a 4-column fluid bento grid with `0.75rem` (12px) internal gutters and `1rem` (16px) viewport margin padding. Desktop and tablet POS expand to 12 columns with locked sidebars.
- **Thumb Zone Hierarchy:** Destructive and primary confirmation actions are anchored to the bottom sticky bento rail (minimum target height 56px). Summary information and contextual toggles (delivery vs. dine-in, split payments) occupy the middle screen span. Order line-item auditing sits in the scrollable top block.
- **Rhythm Rules:** Bento cells must use standard internal edge padding (`space-md` or `space-lg`). Stacked elements within tiles maintain `space-xs` (tight metadata) or `space-sm` (separated controls).

## Elevation & Depth
Depth is rendered through a combination of **Tonal Layering** and **Tactile Edge Highlights** rather than muddy drop shadows.

- **Base Layer (Level 0):** Pure canvas `#0F172A`.
- **Bento Surface (Level 1):** Solid `#1E293B` bounded by a 1px inner hairline stroke of `rgba(255, 255, 255, 0.08)`. No outer shadow.
- **Interactive Tactile Elements (Level 2):** Elevated interactive tiles (buttons, toggles, active steppers) feature a dual-highlight system:
  - Outer shadow: `0 2px 4px rgba(0, 0, 0, 0.3)`.
  - Top edge light: A 1px inset border `inset 0 1px 0 rgba(255, 255, 255, 0.15)`.
  - Bottom edge shadow: `inset 0 -1px 0 rgba(0, 0, 0, 0.4)`.
- **Depressed/Active States:** When a tactile element is engaged, outer shadows collapse, the element shifts down by `1px`, and an inset shadow of `inset 0 2px 4px rgba(0, 0, 0, 0.5)` activates to deliver physical-key feedback.
- **Emerald Focus Glow:** Active confirmation states emit an ambient green corona: `0 0 16px rgba(16, 185, 129, 0.35)`.

## Shapes
A roundedness level of `2` (`0.5rem` / 8px base) grounds the system in high-efficiency industrial design:
- Standard control elements, inputs, and chips take `rounded` (8px).
- Main Bento tile containers take `rounded-lg` (`1rem` / 16px) to clearly group complex sub-systems (such as the split-bill matrix or tip selector).
- Sticky bottom execution trays take `rounded-xl` (`1.5rem` / 24px) on their top edges to demarcate the final checkout sheet.
- Stepper circular selectors and quick-action icon micro-buttons retain full-circle treatments (`rounded-full`) to contrast against rectangular bento layouts.

## Components

### 1. Tactile Action Buttons
- **Primary Confirm ("Charge / Fire Order"):** Emerald green base (`#10B981`) with dark slate typography (`#064E3B`, bold 600). Top inset rim highlight `rgba(255, 255, 255, 0.3)`. Minimum tap height: 56px.
- **Secondary / Utility (Split, Print, Hold):** Surface-container slate (`#1E293B`) with off-white text (`#F8FAFC`) and 1px perimeter border (`#334155`). Depresses on touch.

### 2. Stepper & Split Controls
- Numeric quantity steppers feature an inset trough (`#0B1120`) containing tactile `+` and `–` touch pads flanking a monospaced display (`JetBrains Mono`).
- Split payment matrix renders equal visual sub-cards with active split shares indicated by an emerald left-border accent (3px).

### 3. Bento Order Summary Card
- High-density card encapsulating: table identification, server ID, item count, taxes, subtotal, and total due.
- Total due is displayed using `Space Grotesk` at 26px/32px for unambiguous verification at arm’s length.

### 4. Segmented Toggles (Delivery Mode & Tip Switches)
- **Tip Switch:** Horizontal segmented pill rail with fixed presets (`15%`, `18%`, `20%`, `25%`, `Custom`). Active tip lights up in `#10B981` text over an elevated `#334155` pill, displaying real-time monetary equivalent in `label-sm`.
- **Fulfillment Toggle:** Segmented two- or three-way toggle (Dine In, Takeout, Delivery) recessed within a dark track (`#0F172A`), sliding an elevated slate thumb over the selected option.

### 5. Chips & Status Badges
- Dietary tags, kitchen station routes (Bar, Grill, Cold Prep), and order states use compact, low-padding badges (`space-xs` vertical, `space-sm` horizontal) with monospaced text and 20% opacity color fills matching the status hue.