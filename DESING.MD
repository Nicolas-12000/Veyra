---
version: alpha
name: Veyra
description: >
  Mobile-first, dark-first fitness tracker. The primary context is a user in a
  gym: one hand on the phone, one hand on a barbell. Every component is designed
  for that moment first, then enhanced for desktop insight sessions. Data is the
  hero. The visual language is premium and athletic without being aggressive —
  Raycast meets Apple Health, built thumb-first.

colors:
  # ─── Surfaces — layered by elevation ──────────────────────────────────────
  canvas-base:      "#0f1117"   # Page bg. The deepest layer. Nothing sits below.
  canvas-muted:     "#12141b"   # Bottom nav bg (mobile), sidebar (desktop), secondary panels.
  canvas-elevated:  "#1a1c24"   # Cards, exercise rows, chart containers. 80% of UI lives here.
  canvas-overlay:   "#22252e"   # Inputs, dropdowns, bottom sheets, modal dialogs.
  canvas-hover:     "#ffffff0a" # 4% white — hover/pressed overlay on any surface.

  # ─── Light surfaces — login, onboarding only ───────────────────────────────
  canvas-light:     "#f5f5f7"
  canvas-white:     "#ffffff"

  # ─── Brand accent ─────────────────────────────────────────────────────────
  # ONE color. All interactive elements. Never decorative.
  primary:          "#6B7BFF"   # CTAs, links, active chips, focus ring, slider fill
  primary-dim:      "#4F5FD4"   # Pressed state
  primary-subtle:   "#6B7BFF1A" # 10% — selected row bg, active chip bg, focus area
  primary-on-dark:  "#8B9BFF"   # Inline links on canvas-elevated (slightly brighter)

  # ─── Status / semantic ─────────────────────────────────────────────────────
  # These exist ONLY for data states. Never use in navigation, layout, or decoration.
  success:          "#22D3A0"   # Progresando, weight in band, positive trend
  success-subtle:   "#22D3A01A"
  warning:          "#F5A623"   # Lento, near threshold, borderline state
  warning-subtle:   "#F5A6231A"
  danger:           "#FF6B6B"   # Estancado, regresando, weight out of band
  danger-subtle:    "#FF6B6B1A"

  # ─── Text ──────────────────────────────────────────────────────────────────
  ink:              "#FFFFFF"   # Primary text on dark surfaces
  ink-muted:        "#8B95A8"   # Secondary text, placeholders, table headers
  ink-dimmed:       "#4A5568"   # Disabled, helper text, fine print
  ink-on-primary:   "#FFFFFF"   # Text on primary-colored buttons
  ink-on-light:     "#1d1d1f"   # Text on login/onboarding light surfaces

  # ─── Chart palette — muscle groups ─────────────────────────────────────────
  # Used EXCLUSIVELY in chart data encoding. Never in UI chrome.
  chart-pecho:      "#6B7BFF"   # mirrors primary — chest anchors to brand
  chart-espalda:    "#22D3A0"   # teal
  chart-hombros:    "#F5A623"   # amber
  chart-pierna:     "#FF6B6B"   # coral
  chart-brazos:     "#A78BFA"   # violet
  chart-core:       "#38BDF8"   # sky

  # ─── Borders & hairlines ───────────────────────────────────────────────────
  border:           "#ffffff0f" # 6% white — card borders, dividers
  border-strong:    "#ffffff1a" # 10% white — inputs, table row separators
  border-focus:     "#6B7BFF"   # Focus ring. Same as primary.

  # ─── Overlays & scrims ─────────────────────────────────────────────────────
  scrim:            "#00000066" # 40% black — bottom sheet / modal backdrop
  scrim-light:      "#00000033" # 20% — exercise card overlay on swipe

typography:
  # Font: Inter Variable (Google Fonts). Fallback: system-ui, -apple-system.
  # All sizes below are MOBILE BASE. Desktop overrides noted per token.
  # font-feature-settings: "ss01" globally — enables rounded single-story 'a' in Inter.
  # font-feature-settings: "tnum" on all numeric displays — tabular widths, non-negotiable.

  hero-display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "32px"          # mobile base
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
    # desktop: 48px / same weight / -0.03em
    # Use: Empty state titles, onboarding. Very rare.

  display-lg:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "26px"          # mobile base
    fontWeight: 700
    lineHeight: 1.14
    letterSpacing: "-0.02em"
    # desktop: 36px / -0.025em
    # Use: Dashboard section headings, analytics overview title.

  display-md:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "22px"          # mobile base
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
    # desktop: 28px

  heading:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "18px"          # mobile base
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
    # desktop: 20px
    # Use: Card titles, page sub-section headings.

  subheading:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "15px"          # same mobile and desktop
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
    # Use: Exercise names in session cards, table group headers.

  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "15px"          # NEVER scale below 15px — gym legibility rule
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "-0.01em"

  body-sm:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "13px"          # minimum for secondary info
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.005em"
    # Use: Rest time display, muscle group label below exercise name.

  caption:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0"
    # Use: Timestamps, fine print, chart axis labels.

  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.07em"
    # ALWAYS uppercase. ALWAYS ink-dimmed color.
    # Use: Table column headers, section eyebrows, category labels.

  metric-lg:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "32px"          # mobile base
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: "-0.025em"
    fontFeature: "tnum, ss01"
    # desktop: 40px / -0.03em
    # Use: Big KPI values on metric cards (1RM, current weight).

  metric-md:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "22px"          # mobile base
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: "-0.02em"
    fontFeature: "tnum, ss01"
    # desktop: 24px
    # Use: Set log inputs (weight × reps), chart Y-axis ticks.

  metric-sm:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
    # Use: Numeric cells in tables, inline RPE values in set rows.

  button:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "15px"          # mobile base — larger than desktop default for tap comfort
    fontWeight: 500
    lineHeight: 1.0
    letterSpacing: "-0.01em"
    # desktop: 14px

  button-sm:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.0
    letterSpacing: "0"

rounded:
  none:  "0px"
  xs:    "4px"    # micro badges inside cards
  sm:    "6px"    # rest preset chips, icon surfaces
  md:    "10px"   # inputs, secondary buttons, bottom sheet handle
  lg:    "14px"   # primary cards, exercise cards, chart containers
  xl:    "20px"   # bottom sheets top corners, large modals
  pill:  "9999px" # primary CTAs, filter chips, status badges, search input
  full:  "9999px" # circular elements (avatar, RPE thumb, icon buttons)

spacing:
  xxs:     "4px"
  xs:      "8px"
  sm:      "12px"
  md:      "16px"
  lg:      "20px"  # mobile base card padding (desktop: 24px)
  xl:      "32px"
  xxl:     "48px"
  section: "48px"  # mobile section gap (desktop: 64px)
  safe-bottom: "env(safe-area-inset-bottom, 0px)"  # iOS home bar
  safe-top:    "env(safe-area-inset-top, 0px)"     # iOS status bar

components:

  # ─── Mobile Navigation (PRIMARY — designed first) ─────────────────────────

  bottom-nav:
    backgroundColor: "{colors.canvas-muted}"
    borderColor: "{colors.border-strong}"
    height: "56px"
    padding: "0 8px"
    # Sits above the iOS home bar: add env(safe-area-inset-bottom) to height.
    # 4 destinations: Dashboard · Sesión · Analítica · Perfil
    # On desktop: replaced by {component.sidebar}.

  bottom-nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dimmed}"
    typography: "{typography.caption}"
    size: "44px"  # minimum touch target, square

  bottom-nav-item-active:
    textColor: "{colors.primary}"
    # Active indicator: 2px primary underline above the icon, or icon fill changes.

  # ─── Desktop Navigation (SECONDARY — progressive enhancement) ─────────────

  sidebar:
    backgroundColor: "{colors.canvas-muted}"
    borderColor: "{colors.border}"
    width: "232px"
    # Hidden on mobile. Shown ≥ 1025px.

  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"

  nav-item-active:
    backgroundColor: "{colors.canvas-elevated}"
    textColor: "{colors.ink}"
    typography: "{typography.subheading}"
    # 2px {colors.primary} left border on active item.

  icon-rail-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dimmed}"
    size: "44px"
    rounded: "{rounded.md}"
    # Tablet (641–1024px): sidebar collapses to 52px icon-only rail.

  icon-rail-item-active:
    backgroundColor: "{colors.canvas-elevated}"
    textColor: "{colors.primary}"

  # ─── Buttons ───────────────────────────────────────────────────────────────

  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink-on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"  # mobile base — generous vertical for thumb
    height: "48px"        # minimum 44px touch target, 48px preferred
    # desktop: padding 10px 20px / height 42px

  button-primary-active:
    backgroundColor: "{colors.primary-dim}"
    # Also apply: transform: scale(0.97) — the system-wide press micro-interaction.

  button-secondary:
    backgroundColor: "{colors.canvas-elevated}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "12px 18px"
    height: "48px"
    borderColor: "{colors.border-strong}"

  button-secondary-active:
    backgroundColor: "{colors.canvas-overlay}"

  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    height: "48px"

  button-ghost-active:
    backgroundColor: "{colors.canvas-hover}"
    textColor: "{colors.ink}"

  button-danger:
    backgroundColor: "{colors.danger-subtle}"
    textColor: "{colors.danger}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "12px 18px"
    height: "48px"
    borderColor: "{colors.danger}"
    # NEVER the first CTA in a dialog. Always the secondary/destructive option.

  button-icon:
    backgroundColor: "{colors.canvas-elevated}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    size: "44px"          # exact touch target
    borderColor: "{colors.border}"

  button-icon-active:
    backgroundColor: "{colors.canvas-overlay}"
    textColor: "{colors.ink}"

  stepper-button:
    backgroundColor: "{colors.canvas-overlay}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    size: "44px"          # must be 44px — used next to inputs in set logging
    # The + and - steppers flanking weight/reps inputs.

  # ─── Status Badges ─────────────────────────────────────────────────────────

  badge-progressing:
    backgroundColor: "{colors.success-subtle}"
    textColor: "{colors.success}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "3px 8px"

  badge-slow:
    backgroundColor: "{colors.warning-subtle}"
    textColor: "{colors.warning}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "3px 8px"

  badge-plateaued:
    backgroundColor: "{colors.danger-subtle}"
    textColor: "{colors.danger}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "3px 8px"

  badge-regressing:
    backgroundColor: "{colors.danger-subtle}"
    textColor: "{colors.danger}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "3px 8px"

  badge-neutral:
    backgroundColor: "{colors.border}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "3px 8px"

  # ─── Filter Chips ──────────────────────────────────────────────────────────

  filter-chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.button-sm}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"   # mobile base — generous vertical
    height: "36px"
    borderColor: "{colors.border-strong}"
    # On mobile: chips scroll horizontally in a single row. No wrapping.
    # Active chip scrolls into view on mount.

  filter-chip-active:
    backgroundColor: "{colors.primary-subtle}"
    textColor: "{colors.primary}"
    borderColor: "{colors.primary}"

  # ─── Cards ─────────────────────────────────────────────────────────────────

  card:
    backgroundColor: "{colors.canvas-elevated}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"   # 20px mobile, 24px desktop

  card-interactive:
    backgroundColor: "{colors.canvas-elevated}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"

  card-interactive-active:
    backgroundColor: "{colors.canvas-overlay}"
    borderColor: "{colors.border-strong}"

  metric-card:
    backgroundColor: "{colors.canvas-elevated}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    # Structure: label (uppercase ink-dimmed) → metric-lg value (ink) → delta badge.
    # Mobile: 1 or 2 column grid. Desktop: 4 column grid.
    # Always equal height within a row (CSS Grid auto rows).

  # ─── Bottom Sheet (mobile modal pattern) ───────────────────────────────────

  bottom-sheet:
    backgroundColor: "{colors.canvas-elevated}"
    borderColor: "{colors.border-strong}"
    rounded: "{rounded.xl}"   # only top corners (border-radius: xl xl 0 0)
    padding: "0 20px 0"       # content padding; add safe-bottom to pb
    # Used for: substitution picker, phase change confirm, session summary.
    # Max height: 80dvh. Drag handle: 4px × 36px pill, canvas-overlay, centered at top.
    # Backdrop: {colors.scrim}.
    # On desktop: renders as a centered modal dialog instead.

  bottom-sheet-handle:
    backgroundColor: "{colors.canvas-overlay}"
    rounded: "{rounded.pill}"
    width: "36px"
    height: "4px"
    # Centered at top of sheet, 12px margin above and below.

  # ─── Forms & Inputs ────────────────────────────────────────────────────────

  input:
    backgroundColor: "{colors.canvas-overlay}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
    height: "48px"            # mobile base — 44px minimum enforced
    borderColor: "{colors.border-strong}"

  input-focus:
    borderColor: "{colors.border-focus}"

  input-number-gym:
    backgroundColor: "{colors.canvas-overlay}"
    textColor: "{colors.ink}"
    typography: "{typography.metric-md}"
    rounded: "{rounded.md}"
    height: "64px"            # large hit area for gym use
    borderColor: "{colors.border-strong}"
    fontFeature: "tnum, ss01"
    # The primary input for weight and reps in the session screen.
    # Flanked by stepper buttons on both sides.
    # Suffix slot: "kg" or "lb" in ink-muted, right-aligned.

  # ─── Set Logging — Session Screen (highest priority mobile surface) ─────────

  session-exercise-card:
    backgroundColor: "{colors.canvas-elevated}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    # Structure (top → bottom):
    # 1. Exercise name [{typography.subheading}] + muscle badge + Demo link
    # 2. Technique cue [{typography.body-sm} / {colors.ink-muted}] — 1 line max on mobile
    # 3. Target line: "4 × 8–10 · Descanso 3 min" [{typography.body-sm} / {colors.ink-muted}]
    # 4. Completed set rows (see session-set-row-completed)
    # 5. Active input row (see session-set-row-input)
    # Scroll: the card itself does NOT scroll. The page scrolls through exercise cards.

  session-set-row-completed:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.metric-sm}"
    padding: "10px 0"
    borderColor: "{colors.border}"
    # Columns: Set# · Weight · × · Reps · RPE — all in metric-sm with tnum.
    # Dimmed to signal "done, stop thinking about this."

  session-set-row-active:
    backgroundColor: "{colors.primary-subtle}"
    textColor: "{colors.ink}"
    typography: "{typography.metric-sm}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
    # The row currently being entered. Highlighted with primary-subtle bg.

  session-set-row-pending:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.metric-sm}"
    padding: "10px 0"
    # Optimistic row: shown immediately after tap, before DB confirmation.
    # A subtle pulsing opacity animation signals pending state.

  session-input-row:
    backgroundColor: "transparent"
    padding: "16px 0 0"
    # Layout: [stepper-] [input-number-gym: weight] [stepper+] gap [stepper-] [input-number-gym: reps] [stepper+]
    # Below inputs: RPE slider (full width)
    # Below slider: [button-primary pill: "+ Registrar Set"] — full width on mobile

  rpe-slider:
    trackColor: "{colors.canvas-overlay}"
    fillColor: "{colors.primary}"
    thumbSize: "24px"         # mobile base — 24px for sweaty-hand usability
    thumbColor: "{colors.primary}"
    # desktop: thumbSize 20px
    # Range: 6.0 to 10.0, step 0.5. Current value floats above thumb.
    # Value label: metric-sm / primary color.

  # ─── Floating Session Bar ──────────────────────────────────────────────────

  floating-session-bar:
    backgroundColor: "{colors.canvas-muted}"
    borderColor: "{colors.border-strong}"
    height: "56px"
    padding: "0 20px"
    # Add env(safe-area-inset-bottom) to bottom padding for iOS.
    # backdrop-filter: blur(20px) saturate(180%) at 85% opacity.
    # Left: current exercise name [{typography.subheading}] + "Set X/Y" [{typography.body-sm} / ink-muted]
    # Right: {component.button-primary} pill.
    # CTA label: "→ Siguiente" | "✓ Finalizar" (last exercise)
    # Position: fixed bottom. z-index above all content.

  # ─── Routine Builder ───────────────────────────────────────────────────────

  routine-card:
    backgroundColor: "{colors.canvas-elevated}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"

  routine-card-active-badge:
    backgroundColor: "{colors.primary-subtle}"
    textColor: "{colors.primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"

  routine-day-tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.button-sm}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
    height: "36px"
    # Mobile: tabs scroll horizontally above the exercise list.

  routine-day-tab-active:
    backgroundColor: "{colors.canvas-elevated}"
    textColor: "{colors.ink}"

  routine-exercise-row:
    backgroundColor: "transparent"
    borderColor: "{colors.border}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    # Drag handle [{colors.ink-dimmed}] · Name [{typography.subheading}] · inline fields · "···"
    # Mobile: drag-and-drop via long-press + drag handle tap (not hover-only).

  rest-preset-chip:
    backgroundColor: "{colors.canvas-overlay}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.button-sm}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
    height: "32px"

  rest-preset-chip-active:
    backgroundColor: "{colors.primary-subtle}"
    textColor: "{colors.primary}"

  # ─── Data Table ────────────────────────────────────────────────────────────

  data-table-header:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dimmed}"
    typography: "{typography.label}"
    padding: "10px 16px"
    borderColor: "{colors.border}"

  data-table-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "14px 16px"    # slightly taller rows on mobile for tap comfort
    borderColor: "{colors.border}"
    height: "52px"

  data-table-row-active:
    backgroundColor: "{colors.canvas-hover}"

  # Mobile collapse: table → exercise cards (see Responsive Behavior section).
  analytics-exercise-card:
    backgroundColor: "{colors.canvas-elevated}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    # Used instead of table rows on mobile (≤ 640px).
    # Structure: Exercise name + muscle badge (top) / 1RM + delta + status badge (bottom).

  # ─── Charts ────────────────────────────────────────────────────────────────

  chart-container:
    backgroundColor: "{colors.canvas-elevated}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    # No chart title inside the card — title lives in the section heading above.
    # Minimum height: 220px mobile, 300px desktop.

  chart-tooltip:
    backgroundColor: "{colors.canvas-overlay}"
    borderColor: "{colors.border-strong}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
    # On mobile: tooltip appears above the touch point (never below — finger blocks it).

  chart-dot-in-band:
    backgroundColor: "{colors.success}"
    size: "8px"             # mobile base — larger for touch legibility
    rounded: "{rounded.full}"
    # desktop: 6px

  chart-dot-out-of-band:
    backgroundColor: "{colors.danger}"
    size: "8px"
    rounded: "{rounded.full}"

  chart-reference-line:
    borderColor: "{colors.border-strong}"
    # Phase-change vertical markers on body weight chart.

  # ─── Day Selector (session start) ─────────────────────────────────────────

  day-select-card:
    backgroundColor: "{colors.canvas-elevated}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
    padding: "16px"
    # Grid: 2 columns on mobile, 3–4 on desktop.
    # Shows: day label, split type, last trained date.

  day-select-card-active:
    backgroundColor: "{colors.canvas-overlay}"
    borderColor: "{colors.primary}"

---

## Overview

Veyra is designed **thumb-first**. The primary user is holding a phone with
one hand, between sets, potentially with chalky or sweaty hands, in imperfect
gym lighting. Every component earns its complexity by being genuinely usable
in that moment. Desktop is a second context — important for analytics sessions
at a desk — but it never dictates the mobile experience.

The result is a UI with two personalities:

- **Gym mode** (mobile-first): Maximum input area. Large touch targets. Minimal
  cognitive load. One task visible at a time. No sidebars. No menus. Just sets.
- **Insight mode** (desktop-enhanced): Rich data tables. Multi-series charts.
  Routine editing. Phase management. Everything that requires a keyboard and
  a wide viewport.

Both personalities share the same design language: dark surfaces, a single
electric indigo accent, tabular numerals, and zero decorative chrome.

---

## Colors

### Surface hierarchy — the only "elevation" in Veyra

There are no drop-shadows on any UI element. Depth is communicated by surface
color alone, from darkest (deepest) to lightest (closest):

| Surface | Hex | Where |
|---|---|---|
| `canvas-base` | #0f1117 | Page background — the void |
| `canvas-muted` | #12141b | Bottom nav (mobile), sidebar (desktop), secondary panels |
| `canvas-elevated` | #1a1c24 | All cards, exercise rows, chart containers — 80% of UI |
| `canvas-overlay` | #22252e | Inputs, dropdowns, bottom sheets, modals |

For hover/pressed states on interactive rows, use `{colors.canvas-hover}` (4%
white). It works on any surface without needing a surface-specific hover token.

### One brand color, three status colors

`{colors.primary}` (#6B7BFF) is the interactive color. It appears on: primary
buttons, active nav items, focus rings, active chips, the RPE slider fill,
inline links. It never appears decoratively.

The three status colors — `{colors.success}`, `{colors.warning}`,
`{colors.danger}` — exist only to encode data states. When a user sees amber
in Veyra, it means "pay attention." When they see coral, it means "something
needs to change." This mapping must be consistent everywhere; never use these
colors for non-semantic decoration.

### Chart colors

The six `chart-*` tokens map to muscle groups in the stacked volume bar chart.
They are never used in UI chrome. Treating them as "extra accent colors" breaks
the semantic clarity of the status system.

---

## Typography

### Mobile-first sizing

All sizes are defined for mobile. Desktop overrides are progressive
enhancements noted in the token comments. The key rule: **body copy never
scales below 15px**. In a gym setting — variable lighting, phone at arm's
length, mid-set fatigue — 14px body text is genuinely harder to read.

### Tabular numerals are mandatory on all metrics

`font-feature-settings: "tnum"` on every token in the `metric-*` family and
on every table cell that contains a number. Without tabular numerals, a column
containing `1.05` and `9.87` will have different widths per row, making the
column feel unstable and unreadable. This is non-negotiable.

### The metric scale

Veyra's most important typographic family is `metric-*`. A user comparing a
PR of 107.5 kg against 105.0 kg in a table must perceive that difference
instantly, across 8 rows, under sub-optimal lighting. The combination of
large size, weight 700, tight tracking, and tabular numerals makes this
perception possible. Never substitute `typography.body` for numeric values
in tables or logs.

### Uppercase labels as table anchors

`{typography.label}` — 11px / weight 600 / 0.07em tracking — always uppercase,
always `{colors.ink-dimmed}`. The generous tracking compensates for the small
size and makes the column header scannable in dense tables. Do not relax the
tracking or the weight.

### The weight ladder: 400 / 500 / 600 / 700

Weight 500 is for button labels and `metric-sm` only. Weight 600 is for
subheadings and headings. Weight 700 is for display sizes. Weight 400 is
everything else. Weight 300 is absent. Weight 500 is never used for headings.

---

## Layout

### Mobile-first layout rules

**Everything starts as a single column.** Cards stack vertically. Tables
become stacked card lists. Two-panel layouts become single panels with tabs.
Desktop layout is additive — columns are added as space becomes available.

### Spacing

Base unit: 8px. Sub-base (2, 4px) for tight typographic adjustments only.
`{spacing.lg}` is 20px on mobile and 24px on desktop — use the token, not
the value directly, so overrides are automatic.

**iOS safe areas:** The bottom navigation and the floating session bar must
respect `env(safe-area-inset-bottom)`. Add it to their bottom padding. The
status bar area is handled by `env(safe-area-inset-top)`. Missing safe areas
means UI elements are clipped under the iOS home indicator — critical bug.

```css
.bottom-nav {
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
}
.floating-session-bar {
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
}
```

### Thumb zone — the most important layout concept in Veyra

The gym screen is used one-handed. The comfortable thumb reach on a standard
phone (≈ 375–390px wide) covers roughly the bottom 55% of the screen. The
primary actions in the session screen — "Registrar Set" button, weight/reps
inputs, the RPE slider — must all live in this zone.

```
┌────────────────┐  ← top of screen
│  STRETCH       │  Progress indicator, exercise header (seen, not tapped)
│  ZONE          │  Set history rows (read-only on this screen)
│                │
│────────────────│  ← ~45% from top (thumb reach boundary)
│  COMFORTABLE   │  Weight input + Reps input + steppers
│  THUMB ZONE    │  RPE slider
│                │  "Registrar Set" CTA pill
│  FLOATING BAR  │  ← bottom of screen (fixed position)
└────────────────┘
```

Do not move the primary action button above the thumb zone. Do not place the
RPE slider above the weight input. The vertical order of the session input row
is fixed: weight → reps → RPE → CTA button.

### Session screen: fullscreen mobile layout

When a session is active on mobile:
- The bottom nav bar is hidden (replaced by the floating session bar).
- The top bar shows only: back arrow + day label + session time.
- Full screen height is available for exercise cards.
- Cards scroll vertically. Swipe left/right to navigate between exercises.
- The floating session bar persists at the bottom, always visible.

### Desktop: sidebar + content

Desktop (≥ 1025px) introduces the 232px fixed sidebar. Content area is fluid
with no max-width cap — charts and tables should use all available width.

Tablet (641–1024px): sidebar collapses to a 52px icon-only rail.

---

## Elevation & Depth

| Level | Surface | Where |
|---|---|---|
| Base | `canvas-base` · no border | Page background |
| Muted | `canvas-muted` · right/top `border` hairline | Bottom nav, sidebar |
| Elevated | `canvas-elevated` · `border` around | All cards (80% of UI) |
| Overlay | `canvas-overlay` · `border-strong` | Inputs, dropdowns, bottom sheets |
| Floating | `canvas-muted` at 85% opacity · `backdrop-filter: blur(20px) saturate(180%)` · `border-strong` top/bottom | Session bar, modals |

**No drop-shadows on any UI element.** Shadow is absent from the system.
Depth is entirely communicated through surface color change. If something
needs to feel "above" its container, lighten its surface one step.

### Bottom sheets vs modals

On mobile, contextual pickers (substitution picker, phase change, session
summary) use `{component.bottom-sheet}`. It slides up from the bottom with a
drag handle, respects `safe-area-inset-bottom`, and can be dismissed by
dragging down or tapping the scrim.

On desktop (≥ 1025px), the same content renders as a centered modal dialog
with the same `{component.card}` surface.

---

## Shapes

### Two grammars, no mixing

1. **Pill** (`{rounded.pill}` — 9999px): Primary action buttons, filter chips,
   status badges, search input. Pill = "this is the primary action." Every
   pill-shaped element in Veyra is interactive.

2. **Rounded rect** (`{rounded.md}` 10px / `{rounded.lg}` 14px): Cards, inputs,
   secondary buttons, bottom sheets (top corners only), icon buttons.

Do not use intermediate radii (e.g., 12px, 16px). If it's a primary CTA, it's
a pill. If it's a card, it's `{rounded.lg}`. If it's an input or secondary
button, it's `{rounded.md}`.

The floating session bar and bottom nav have `border-radius: 0` on bottom
edges (they touch the screen edges) and `{rounded.xl}` on top corners only.

---

## Components

### Navigation

**Mobile — `{component.bottom-nav}`**: 4 destinations. Each item is a 44 × 44px
touch target with an icon + a label in `{typography.caption}`. The active item
uses `{colors.primary}`. The bar sits above `env(safe-area-inset-bottom)` on iOS.
Destinations: Dashboard · Sesión · Analítica · Perfil.

**Tablet — `{component.icon-rail-item}`**: Sidebar collapses to 52px wide.
Icon only, no label. Tooltip on hover reveals the destination name.

**Desktop — `{component.sidebar}`**: 232px fixed. Wordmark at top (24px / 700 /
`{colors.primary}`), nav items in the middle, user profile strip at bottom
(avatar + name + Settings link). Active item: `{component.nav-item-active}` —
`{colors.canvas-elevated}` background + 2px `{colors.primary}` left border.

### Buttons

**`{component.button-primary}`**: The pill CTA. `{colors.primary}` background.
Minimum height 48px on mobile (44px on desktop). Press state: `{colors.primary-dim}`
+ `transform: scale(0.97)`. Focus: 2px solid `{colors.border-focus}` outline,
2px offset. Full-width on mobile within forms and session inputs.

**`{component.button-secondary}`**: `{colors.canvas-elevated}` background, `{rounded.md}`.
Used for non-primary available actions: "Duplicar rutina", "Archivar", "Ver historial".

**`{component.button-ghost}`**: Transparent. Used for "Cancel" in dialogs, row overflow
actions, icon-adjacent labels.

**`{component.button-danger}`**: `{colors.danger-subtle}` background, `{colors.danger}` border.
Destructive actions only. Never the first CTA in a dialog.

**`{component.button-icon}`**: 44 × 44px square. `{rounded.md}`. Used for the drag handle
reveal, the "···" overflow menu trigger, the Demo video link in exercise cards.

**`{component.stepper-button}`**: 44 × 44px square. `{rounded.sm}`. Flanks the weight
and reps inputs in the session screen. Pressing + or - increments by the
appropriate step (0.5 kg / 1 rep).

### Session Screen Components

**`{component.session-exercise-card}`**: The primary unit of the session screen.
Displays one exercise at a time. Structure:
1. Header: exercise name + muscle badge + Demo link (external, icon button).
2. Technique cue: one line max on mobile. Truncate with "···" expand.
3. Target: "4 × 8–10 · Descanso 3 min" — the objective from the routine template
   (or session override if applied).
4. Completed set rows: each row shows Set# · weight · reps · RPE in `{typography.metric-sm}`.
   Completed rows use `{colors.ink-muted}`.
5. Input row: `{component.session-input-row}`.

**`{component.session-input-row}`**: Contains the weight and reps inputs with steppers,
the RPE slider, and the "Registrar Set" button. All elements must be in the
comfortable thumb zone (bottom 55% of the screen). The weight input pre-fills
from the previous set. The RPE slider pre-fills at the previous set's RPE.

**`{component.floating-session-bar}`**: Fixed at the bottom. Shows current exercise
progress and the primary navigation CTA. Its presence adds 56px + safe-area-bottom
of bottom padding to the scroll container — otherwise the last set row is
hidden behind the bar.

### Bottom Sheet

**`{component.bottom-sheet}`**: Slides up from the bottom. Max height: 80dvh.
Drag handle centered at the top (4px × 36px pill). Backdrop: `{colors.scrim}`.
Inner content scrollable if it exceeds the sheet height. Dismissible by
dragging down or tapping the scrim.

Used for: substitution picker, phase change confirmation, session summary
on workout completion.

On desktop (≥ 1025px): renders as a centered modal dialog with the same
`{canvas-elevated}` surface and `{rounded.xl}` corners.

### Cards and Tables

**`{component.metric-card}`**: Contains a `{typography.label}` eyebrow (muscle group or
time period), a `{typography.metric-lg}` primary value, and a delta badge. Mobile: 2-column
grid. Desktop: 4-column grid. Same height within a row via CSS Grid.

**`{component.data-table-row}`**: On mobile (≤ 640px), the analytics table collapses into
`{component.analytics-exercise-card}` — one card per exercise, showing name, 1RM, period
change %, and status badge. The table format returns on tablet and desktop.

**`{component.filter-chip}`**: On mobile, filter chips scroll horizontally in a single
sticky row above the content. No wrapping. The active chip is always scrolled
into view on mount. On desktop, chips can wrap into 2 rows if there are many.

### Charts

**`{component.chart-container}`**: Minimum height 220px on mobile, 300px on desktop.
No inner chart title — the section heading above the card provides context.
Chart data does not re-animate on filter changes — animate once on initial mount
(`animationDuration: 600`), then `isAnimationActive={false}` on subsequent renders.

Chart axis labels: `{typography.caption}` / `{colors.ink-dimmed}`. Horizontal grid
lines only (no vertical). No tick marks. Touch interactions use a full-height
vertical crosshair (`{colors.border-strong}`) to help trace values.

**Body weight dots**: Each weekly data point is an 8px circle on mobile, 6px on
desktop. Color: `{colors.success}` if within the projection band, `{colors.danger}`
if outside. The projection line uses `{colors.primary}` dashed. The actual weight
line uses `{colors.ink}` solid. The band area is `{colors.primary}` at 8% opacity fill.

---

## Do's and Don'ts

### Do
- Design for the thumb first. If the primary CTA requires a stretch, move it down.
- Use `{colors.primary}` for every interactive signal — links, CTAs, focus rings,
  active states. One brand color, always.
- Keep all numeric values in `{typography.metric-sm}` or above with `font-feature-settings: "tnum"`.
- Use 44px as the minimum touch target. Prefer 48px for primary actions.
- Respect iOS safe areas with `env(safe-area-inset-bottom)` on the bottom nav
  and the floating session bar.
- Communicate depth through surface color. `canvas-elevated` cards on a
  `canvas-base` page read as elevated without any shadow.
- Use `{rounded.pill}` only for primary CTAs and filter chips. Every pill is interactive.
- Animate charts once on mount. Disable re-animation on filter changes.
- Place the "Registrar Set" CTA and the RPE slider in the bottom 55% of the
  session screen (comfortable thumb zone).

### Don't
- Don't add drop-shadows to any UI element. Depth comes from surface, not shadow.
- Don't introduce a second accent color. If you feel the need, use a surface change.
- Don't use `{colors.success}`, `{colors.warning}`, `{colors.danger}` decoratively.
  They are data states. Misusing them erodes the semantic trust.
- Don't use `{colors.chart-*}` outside of charts. They are data encoding tokens.
- Don't set table cell numbers in `{typography.body}` — use `{typography.metric-sm}`
  with tabular numerals.
- Don't place primary actions above the thumb zone on the session screen.
- Don't use hover-only interactions for drag-and-drop in the routine builder —
  support long-press on mobile.
- Don't re-animate charts on filter changes. It's visually janky and serves no purpose.
- Don't let the floating session bar overlap content without bottom padding compensation.
- Don't render bottom sheets on desktop. Use modal dialogs instead.
- Don't round the bottom nav or floating session bar on bottom edges — they are
  full-width bars touching screen edges.
- Don't scale body text below 15px. Gym legibility is a hard constraint.

---

## Responsive Behavior

### Breakpoints

These are defined smallest → largest. Each adds capabilities to the layout
without removing mobile functionality.

| Name | Viewport | Layout change |
|---|---|---|
| **Mobile S** | ≤ 375px | Single column. Filter chips horizontal scroll. Session fullscreen. Hero text 28px. |
| **Mobile** | 376–640px | Single column. Bottom nav. Cards stacked. Table → analytics-exercise-card. |
| **Tablet** | 641–1024px | Icon rail sidebar (52px). 2-col metric grid. Table visible. |
| **Desktop** | 1025–1440px | Full sidebar (232px). 4-col metric grid. Routine two-panel. |
| **Wide** | ≥ 1441px | Layout locks at 1440px. Margins absorb extra width. |

### Touch targets by breakpoint

| Breakpoint | Minimum target | Button height | Input height |
|---|---|---|---|
| Mobile | 44px | 48px | 48px |
| Tablet | 44px | 44px | 44px |
| Desktop | 32px (pointer) | 42px | 42px |

Touch targets on mobile are physiological requirements, not preferences.
44px is the Apple Human Interface Guidelines minimum for a reason — at smaller
sizes, tap error rates increase measurably.

### Typography scaling

| Token | Mobile | Desktop |
|---|---|---|
| `hero-display` | 32px | 48px |
| `display-lg` | 26px | 36px |
| `display-md` | 22px | 28px |
| `heading` | 18px | 20px |
| `body` | 15px | 15px (never changes) |
| `metric-lg` | 32px | 40px |
| `metric-md` | 22px | 24px |
| `button` | 15px | 14px |

### Component behavior by breakpoint

**Navigation:**
- Mobile (≤ 640px): `{component.bottom-nav}` with 4 icons + labels.
- Tablet (641–1024px): `{component.icon-rail-item}` in a 52px left rail.
- Desktop (≥ 1025px): `{component.sidebar}` at 232px with full labels.

**Analytics table:**
- Mobile (≤ 640px): `{component.analytics-exercise-card}` — stacked cards, one per exercise.
- Tablet+ (≥ 641px): `{component.data-table-row}` — horizontal table with all columns.

**Routine builder:**
- Mobile: single panel with day tabs at top.
- Desktop: two-panel layout (days list left, exercises right).

**Bottom sheets vs modals:**
- Mobile + Tablet: `{component.bottom-sheet}` slides up.
- Desktop: centered modal dialog.

**Filter chips:**
- Mobile: horizontal scroll row, no wrapping, active chip scrolled into view.
- Desktop: wrapped row, all chips visible.

**Metric cards:**
- Mobile: 2-column grid (or 1-column on very small screens).
- Tablet: 2–3 column grid.
- Desktop: 4-column grid.

### Swipe gestures (session screen, mobile only)

In the active session screen, horizontal swipe navigates between exercises
(left = next, right = previous). The swipe gesture must be distinguishable
from vertical scroll — use a threshold of 30px horizontal movement before
committing to a swipe, and cancel if the vertical component exceeds horizontal.

A pagination indicator (dots) shows position among the session's exercises.
Position: below the exercise card, above the input row.

---

## Font Setup

Inter Variable is loaded from Google Fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900&display=swap"
  rel="stylesheet"
/>
```

Apply globally in CSS:

```css
:root {
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  font-feature-settings: "ss01", "cv05";  /* rounded 'a', alternate digits */
  -webkit-font-smoothing: antialiased;     /* REQUIRED on dark surfaces */
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* Tabular numbers — apply to all metric elements */
.tabular-nums, td, [data-metric] {
  font-feature-settings: "tnum", "ss01";
}
```

`-webkit-font-smoothing: antialiased` is non-negotiable on dark surfaces.
Sub-pixel rendering makes Inter look heavy and blurry on dark backgrounds.