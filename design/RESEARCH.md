# UI/UX design systems + the Claude design ecosystem

Research notes for building a world-class web app. Companion to `plumbline-console.html`,
a working mock built from the primitives listed here.

Last verified: 2026-08-26.

---

## 1. The component layer — what you actually build on

The market moved decisively to **headless primitives + code you own**. Styled,
batteries-included kits (MUI's styled layer, Chakra, Ant) lost ground because you
inherit someone else's visual identity and then fight it.

| Library | What it is | When to pick it |
|---|---|---|
| [Base UI](https://base-ui.com/) | Headless React primitives from the MUI team. v1.x stable, ~35 components. | **Default choice.** Actively staffed, cleaner APIs than Radix. |
| [shadcn/ui](https://ui.shadcn.com/) | Not a dependency — a registry that copies component source into your repo. | Almost always, on top of Base UI or Radix. You own the code. |
| [Radix Primitives](https://www.radix-ui.com/primitives) | The original headless set. Acquired by WorkOS; pace slowed. | Existing codebases. `shadcn init -b radix` still works. |
| [React Aria](https://react-spectrum.adobe.com/react-aria/) | Adobe's behavior + a11y layer. | When accessibility is a hard requirement, not a goal. |
| [Ark UI](https://ark-ui.com/) | Same idea, framework-agnostic (React/Vue/Solid/Svelte). | Non-React or multi-framework. |

**Key 2026 change:** as of the [July 2026 changelog](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default),
`npx shadcn init` scaffolds on **Base UI** by default. Radix is *not* deprecated — both
get every component. There's a migration skill for going component-by-component.

**Color + tokens:** [Radix Colors](https://www.radix-ui.com/colors) is the best public
example of a 12-step scale designed for light *and* dark from the start. Steal the
structure (step 1–2 = ground, 3–5 = component backgrounds, 6–8 = borders, 9–10 = solid,
11–12 = text) even if you replace every hue.

**Escaping the default skin:** raw shadcn zinc is now a recognizable "AI built this" tell.
[tweakcn](https://tweakcn.com/) is a visual theme editor for exactly this problem.

---

## 2. Reference systems — where taste comes from

Read these for *rationale*, not components.

- [Vercel Geist](https://vercel.com/geist/introduction) — the benchmark for dense,
  restrained, developer-facing product UI.
- [IBM Carbon](https://carbondesignsystem.com/) — the best fully-public enterprise
  system; unmatched on data tables and complex forms.
- [Atlassian Design System](https://atlassian.design/) — the best writing on content
  design, empty states, and error copy.
- [Shopify Polaris](https://polaris.shopify.com/) — decision rationale documented better
  than almost anyone.
- [GitHub Primer](https://primer.style/) — how a system survives twenty years of
  accreted surface area.
- [Adobe Spectrum](https://spectrum.adobe.com/) — rigorous on scale, density, and platform.
- [Material 3 Expressive](https://m3.material.io/) and
  [Apple HIG](https://developer.apple.com/design/human-interface-guidelines) — the two
  poles of 2026. Google went expressive (saturated color, variable type, elastic motion);
  Apple went Liquid Glass (translucency, refraction, depth). Convergence is over; a
  neutral "modern" look now reads dated on both.
- [Design Systems Repo](https://designsystemsrepo.com/design-systems/) and
  [The Component Gallery](https://www.component.gallery/) — compare how thirty systems
  each solved the same component.

---

## 3. Claude ecosystem — skills, canvas, MCP

### First-party skills ([anthropics/skills](https://github.com/anthropics/skills))

Install with `/plugin marketplace add anthropics/skills`, then `/plugin install <set>`.

| Skill | What it does |
|---|---|
| [frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | The important one. Forces a committed aesthetic direction instead of a safe default, and names the failure modes ("AI slop") explicitly. |
| [web-artifacts-builder](https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder) | Self-contained single-file web apps. |
| [canvas-design](https://github.com/anthropics/skills/tree/main/skills/canvas-design) | Multi-artboard visual layouts. |
| [theme-factory](https://github.com/anthropics/skills/tree/main/skills/theme-factory) | Generates a coherent token set. |
| [brand-guidelines](https://github.com/anthropics/skills/tree/main/skills/brand-guidelines) | Holds every screen to one identity. |
| [webapp-testing](https://github.com/anthropics/skills/tree/main/skills/webapp-testing) | Drives the built UI in a real browser — the loop that catches visual bugs. |
| [algorithmic-art](https://github.com/anthropics/skills/tree/main/skills/algorithmic-art) | Generative backgrounds and decorative graphics. |

Also available in this environment as built-ins: `design` (canvas editor),
`artifact-design`, `artifact-diagramming`, `dataviz`, `skill-creator`.

### Claude Design

[claude.ai/design](https://claude.ai/design) — Anthropic Labs' visual canvas. Output is
real HTML, not a picture of a design; exports to PDF/PPTX/HTML or hands off to Claude Code.

### MCP servers that raise design quality

The single biggest quality jump comes from **giving the agent eyes and real components**:

- [shadcn MCP](https://ui.shadcn.com/docs/mcp) — the agent reads your registry and
  installs real components instead of hand-writing markup.
- [Figma Dev Mode MCP](https://www.figma.com/blog/introducing-figma-mcp-server/) — hands
  over variables, components, and layout data from the file itself.
- [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) and
  [Playwright MCP](https://github.com/microsoft/playwright-mcp) — render, screenshot,
  inspect, fix. Without this the agent is designing blind.

### Community collections

Large curated lists exist ([travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills),
[composio-community/awesome-claude-plugins](https://github.com/composio-community/awesome-claude-plugins),
[wilwaldon/Claude-Code-Frontend-Design-Toolkit](https://github.com/wilwaldon/Claude-Code-Frontend-Design-Toolkit)).
Treat install-count and star-count claims in blog roundups with suspicion — several
widely-quoted numbers could not be verified against GitHub directly.

---

## 4. Craft references

- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) — the spec every
  primitive above implements. Read the patterns you actually use.
- [Inclusive Components](https://inclusive-components.design/) — builds each component
  from the accessibility outward.
- [Refactoring UI](https://www.refactoringui.com/) — fastest path from "looks amateur"
  to "looks intentional".
- [Motion](https://motion.dev/) — spring physics and layout animation, plus the
  judgement about when not to.
- [Google Fonts Knowledge](https://fonts.google.com/knowledge) — type pairing and scale.

---

## 5. The stack this mock implies

```
Next.js (App Router)
  └ Tailwind v4                 — utility layer, CSS-first config
  └ shadcn/ui on Base UI 1.x    — component source in your repo
  └ Radix Colors-style tokens   — 12-step scales, light + dark defined together
  └ TanStack Table v8           — sorting / selection / column sizing
  └ lucide-react                — 1.3px strokes at 15px so icons sit at text weight
  └ motion                      — reserved for state changes that need explaining
  └ cmdk                        — ⌘K is primary navigation in a research tool
  └ Recharts or visx            — or hand-rolled SVG for full control
```

### Rules the mock follows

- One accent hue, spent in one place. Everything around it stays quiet.
- Status colors (good / minor / serious / critical) are **reserved** — never reused as
  chart series colors, and always shipped with a word so meaning is never color-alone.
- One series per plot, one hue, recessive grid. Never a second y-axis.
- Both themes designed, not inverted; every color defined at `:root` and only
  *redefined* under `prefers-color-scheme` / `[data-theme]`.
- Tabular numerals wherever digits line up in a column.
