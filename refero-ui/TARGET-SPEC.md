# Target spec — reverse-engineered from refero.design

Extracted on 2026-08-26 from the live production stylesheet
(`https://refero.design/static/css/main.4160b381.css`, 303 KB) and the site's
two webfont files. These are **measured facts, not guesses**.

## Typography (measured)

Refero ships two licensed faces:

| Role | Refero uses | Name table says | Free stand-in |
|---|---|---|---|
| UI / body | `Base-Variable` | **PP Neue Montreal Variable** (Pangram Pangram, wght 200–800) | **Instrument Sans** |
| Display / titles | `Title` | **Kalice** (Margot Lévêque, 400 only) | **Instrument Serif** |

PP Neue Montreal is a tight neo-grotesque; Kalice is a high-contrast editorial
display serif. Instrument Sans + Instrument Serif are a designed pair with the
same relationship, and both are on Google Fonts.

**Letter-spacing is the single biggest tell.** Refero tracks everything tight
and negative:

```
-0.02em   × 150 declarations   ← the default
-0.015em  ×  56
-0.0225em ×  51
-0.025em  ×  29
-0.0275em ×  18
-0.03em   ×  11
```

Larger type gets tighter tracking. Nothing is set at 0 except small caps/labels.

**Type scale actually used** (px, by frequency):
`16 (×115) · 12 (×60) · 20 (×52) · 25 (×27) · 14 (×21) · 50 (×19) · 40 (×16) · 32 (×16) · 64 (×7) · 28 (×6) · 17 (×6)`

16px is the body default. 12px is the label/meta size. The display steps are
25 / 32 / 40 / 50 / 64.

## Color — the exact token scale

Refero is **dark-first** (`body` = light, `body#dark-theme` and
`body:not(#light-theme)` = dark; the dark block is the fallback).

The neutral ramp is **blue-biased**, not neutral grey. This matters — it is
what makes the surface read as cool and expensive rather than flat.

### Light (`body`)
```
--gray-solid-0:   #fff        --gray-alpha-100: rgba(55,80,155,.039)
--gray-solid-100: #f7f8fb     --gray-alpha-200: rgba(12,41,126,.071)
--gray-solid-200: #eef0f6     --gray-alpha-300: rgba(12,26,105,.141)
--gray-solid-300: #dddfea     --gray-alpha-400: rgba(1,17,88,.239)
--gray-solid-400: #c2c6d7     --gray-alpha-500: rgba(2,18,73,.38)
--gray-solid-500: #9fa5ba     --gray-alpha-600: rgba(3,14,49,.541)
--gray-solid-600: #777d90     --gray-alpha-700: rgba(1,8,34,.678)
--gray-solid-700: #525769     --gray-alpha-800: rgba(2,7,24,.831)
--gray-solid-800: #2d313f     --gray-alpha-900: #2d313f
--gray-solid-900: #13151b     --gray-alpha-0:   #fff
--surface-elevated: #fff      --color-accent: #000
```

### Dark (`body#dark-theme`)
```
--gray-solid-0:   #101216     --gray-alpha-100: rgba(186,192,239,.059)
--gray-solid-100: #1a1c23     --gray-alpha-200: rgba(222,210,241,.092)
--gray-solid-200: #23242a     --gray-alpha-300: rgba(185,201,247,.165)
--gray-solid-300: #2c303b     --gray-alpha-400: rgba(172,194,253,.251)
--gray-solid-400: #373e50     --gray-alpha-500: rgba(177,198,254,.366)
--gray-solid-500: #4b546b     --gray-alpha-600: rgba(196,211,254,.517)
--gray-solid-600: #6d768e     --gray-alpha-700: rgba(209,219,255,.701)
--gray-solid-700: #979fb9     --gray-alpha-800: rgba(221,230,255,.929)
--gray-solid-800: #ced7ee     --gray-alpha-900: #fff
--gray-solid-900: #fff        --gray-alpha-0:   #13151a
--surface-elevated: #2a2d37   --color-accent: #fff
--color-background: #13151a
```

### Semantic aliases (verbatim from the sheet)
```
--fill-base:     var(--gray-solid-0)     --text-primary:    var(--gray-solid-900)
--fill-subtle:   var(--gray-solid-100)   --text-secondary:  var(--gray-alpha-600)
--fill-muted:    var(--gray-solid-200)   --text-tertiary:   var(--gray-alpha-400)
--fill-moderate: var(--gray-solid-300)   --text-quaternary: var(--gray-alpha-200)
--fill-strong:   var(--gray-solid-900)   --text-on-button:  var(--gray-solid-0)
--fill-elevated: var(--surface-elevated)

--stroke-primary:    var(--gray-solid-900)
--stroke-secondary:  var(--gray-alpha-600)
--stroke-tertiary:   var(--gray-alpha-400)
--stroke-quaternary: var(--gray-alpha-200)
--stroke-on-button:  var(--gray-solid-0)
```

### Status colors (light / dark)
```
green: #059669 / #10b981   alpha rgba(16,185,129,.08)  / rgba(52,211,153,.16)
red:   #d93655 / #f43f5e   alpha rgba(244,63,94,.07)   / rgba(251,113,133,.25)
amber: #d98f0a / #f59e0b   alpha rgba(245,158,11,.1)   / rgba(251,191,36,.17)
```

**The accent is monochrome.** `--color-accent` is `#000` in light and `#fff` in
dark. Primary buttons are black-on-white / white-on-black. There is no brand
hue. Color appears only for status. Do not invent an accent hue.

## Borders — the signature technique

Refero draws hairlines with **inset box-shadows, not `border`**:
```
box-shadow: inset 0 0 0 1px var(--gray-alpha-100);   ← ×10
box-shadow: inset 0 0 0 1px var(--stroke-quaternary); ← ×7
box-shadow: inset 0 0 0 .3px var(--stroke-tertiary);
```
This keeps box dimensions stable on hover/focus (no 1px layout shift) and lets
sub-pixel hairlines render. Focus rings are `box-shadow: 0 0 0 2px var(--gray-alpha-400)`.

## Shadows — blue-tinted, never neutral black

```
0 1px 3px 0 rgba(12,41,126,.09), 0 0 1px .4px rgba(12,41,126,.031)   ← default card, ×13
0 3px 8px 0 rgba(12,41,126,.09), 0 0 1px .4px rgba(12,41,126,.031)   ← hover, ×4
0 8px 20px 0 rgba(12,41,126,.09)                                     ← popover
0 0 1px .4px rgba(12,41,126,.1), 0 8px 20px rgba(12,41,126,.09)      ← modal
```
`rgba(12,41,126)` is a deep navy. Neutral-black shadows will read wrong.

## Radii (by frequency)

`8px (×63) · 16px (×60) · 50% (×56) · 12px (×39) · 20px (×26) · 24px (×21) · 4px (×16) · 32px (×11) · 28px (×10)`

Cards are 16px. Controls are 8–12px. Pills/chips are fully round. This is a
**generously rounded** system — under-rounding is the most likely miss.

## Motion

```
transition: all .2s ease   ← ×110, the default for essentially everything
transition: all .3s ease   ← ×27, larger surfaces
cubic-bezier(.625,.05,0,1) ← ×6, the expressive curve
```
Simple and uniform. Do not over-choreograph.

## What Refero *is*

"The largest collection of UI/UX references and design inspiration for web and
iOS. Explore tens of thousands of screenshots with advanced search capabilities."

A screenshot gallery: dense card grid, heavy filtering (categories, tags,
platform, color), search-first, hover reveals metadata, dark by default.
