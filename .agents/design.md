# Universal Design System & Frontend Standards

This document establishes the official visual language, design system tokens, and frontend quality standards across the workspace. All subprojects (`Student-Complaint-Box`, `Trying new/*`) adhere to these specifications to guarantee cohesive, human-centered, and non-generic user experiences.

---

## 1. Core Token Specifications

### Type Scale
- **Ratio:** Major Third (1.250)
- **Scale:**
  1. **Caption / Micro:** `0.80rem` (12.8px) — Metadata, table captions, micro-labels
  2. **Body / Base:** `1.00rem` (16.0px) — Standard copy, input fields, button labels
  3. **Lead / Subhead:** `1.25rem` (20.0px) — Section intro, card headings, sub-navigation
  4. **Section Title (H3):** `1.563rem` (25.0px) — Content section headers, module titles
  5. **Page Heading (H2):** `1.953rem` (31.25px) — Primary view headings, dashboard headers
  6. **Display Title (H1):** `2.441rem` (39.06px) — Viewport anchor titles, hero displays
- **Font Stacks:**
  - *Serif / Editorial:* `Lora`, `Charter`, `Georgia`, serif (for display titles, long-form editorial, and scholarly prompts)
  - *Sans / UI:* `Plus Jakarta Sans`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, sans-serif (for interactive controls, tables, metrics)
  - *Monospace:* `JetBrains Mono`, `SFMono-Regular`, `Consolas`, monospace (for code, terminal, diffs)
  - *Banned Fonts:* `Inter`, `Geist`, `Space Grotesk` (to prevent uniform template aesthetic)

---

### Spacing Scale
- **Base Unit:** `0.25rem` (4px)
- **Scale:**
  1. `0.25rem` (4px) — Micro-gaps, status badge padding, icon-text spacing
  2. `0.50rem` (8px) — Inline button padding Y, tag clusters, compact list spacing
  3. `0.75rem` (12px) — Standard input field padding Y, compact stack rhythm
  4. `1.00rem` (16px) — Standard component gutter, internal card padding, nav item spacing
  5. `1.50rem` (24px) — Group spacing, modal interior padding, vertical block gaps
  6. `2.00rem` (32px) — Major section sub-block separations, desktop grid column gutters
  7. `3.00rem` (48px) — Section margins, responsive container padding Y
  8. `4.50rem` (72px) — Macro viewport spacing, editorial whitespace dividers

---

### 5-Colour Palette & Audience Justification

| Step | Color Name | Hex Code | Semantic Role | Contrast (on `#F9F8F5`) |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Warm Alabaster** | `#F9F8F5` | **Background Canvas** | N/A (Foundation) |
| **2** | **Pure Studio** | `#FFFFFF` | **Surface & Card Layer** | Structural contrast |
| **3** | **Carbon Ink** | `#1E1E1C` | **Primary Text & Headings** | 14.8:1 (AAA) |
| **4** | **Weathered Slate** | `#6E6A63` | **Secondary / Muted Text & Dividers** | 5.2:1 (AA) |
| **5** | **Restrained Terracotta** | `#B84A28` | **Interactive Accent & Key Focal Action** | 5.5:1 (AA) |

#### Audience & Ergonomic Justification:
The audience consists of students, academic researchers, and engineers reviewing dense syllabi, exam questions, codebases, and systems. Prolonged sessions on pure-white (`#FFFFFF`) or blue-lit screens produce ocular fatigue, while generic saturated AI purples (`#7C3AED` to `#4F46E5`) erode scholarly credibility.
- **`#F9F8F5` (Warm Alabaster)** provides a low-emission, non-yellowing foundation mimicking archival book paper.
- **`#FFFFFF` (Pure Studio)** creates organic foreground elevation without artificial border weight.
- **`#1E1E1C` (Carbon Ink)** avoids the harsh optical vibration of pure black (`#000000`) while exceeding WCAG AAA contrast standards.
- **`#6E6A63` (Weathered Slate)** supplies legible hierarchy for metadata and timestamps without disappearing.
- **`#B84A28` (Terracotta Rust)** acts as a disciplined, single focal accent evoking editorial annotations, avoiding neon or gradient gimmickry.

---

### Border-Radius Scale
1. **Compact (`sm`):** `4px` (`0.25rem`) — Form inputs, code badges, table rows, tags
2. **Container (`md`):** `8px` (`0.50rem`) — Interactive buttons, surface panels, dropdown menus
3. **Overlay (`lg`):** `14px` (`0.875rem`) — Modals, drawer sheets, floating action containers

---

### Elevation & Shadow Definition
- **Single Ambient Shadow:**
  ```css
  box-shadow: 0 1px 3px rgba(30, 30, 28, 0.05), 0 4px 12px rgba(30, 30, 28, 0.04);
  ```
  - Derives luminance absorption directly from `#1E1E1C` (Carbon Ink).
  - Eliminates dark muddy halos; provides organic depth for floating action sheets and dropdowns while cards remain grounded.

---

## 2. Design Direction & Anti-Template Guardrails

### Strict Prohibitions:
- ❌ **No Gradient Text:** Text must be solid, crisp, and high-contrast.
- ❌ **No Violet-to-Indigo Transitions:** No purple SaaS buttons or futuristic AI glows.
- ❌ **No Decorative Clutter:** No radial orbs, background dot matrices, liquid glass effects, sparkle icons, or animated arrows.
- ❌ **No Generic Icons or Emojis:** Do not use Lucide icons, emojis in navigation, or generic clip-art (lightning bolts for speed, rockets for launch). Use consistent, curated SVGs or Heroicons.
- ❌ **No Formulaic SaaS Templates:** No centered hero with two buttons, no logo strips, and no uniform 3-card feature grids.
- ❌ **No Fluff Copy:** Replace vague slogans ("Unlock powerful insights") with concrete, task-oriented phrasing ("Compare past university exam questions directly against syllabus objectives").

### Layout & Composition Standards:
- **Asymmetric Editorial Rhythm:** Alternate wide reading columns with focused utility sidebars.
- **Direct Action Anchor:** Lead immediately with the primary operational task rather than marketing preamble.
- **Tactile States:** Hover, active, and focus rings must use solid `#B84A28` offsets (`outline: 2px solid #B84A28; outline-offset: 2px;`).

---

## 3. Systematic Implementation & Verification Workflow

When updating or building components across the workspace:
1. **Build One Representative Section First:** Implement with authentic, realistic content (no placeholder lorem ipsum).
2. **Dual-Viewport Inspection:** Inspect at desktop (1280px+) and mobile (375px) widths before expanding.
3. **Defect Audit:** Verify text wrapping, overflow margins, interactive hit-targets (minimum 44x44px on mobile), and contrast ratios.
4. **Iterative Extension:** Roll out tokens and layouts incrementally to adjacent views.

