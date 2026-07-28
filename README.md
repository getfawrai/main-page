# FawrAI Design System

> **Version 2.0 — May 2026**
> Built from *FawrAI Brand Book v1.0*, evolved through real product work (marketing site + ROI calculator).

---

## 00. What is FawrAI?

FawrAI is a **fully managed AI-powered sales and client relationship system** built exclusively for aesthetic and medical clinics in Dubai and the GCC. FawrAI builds, runs, and maintains the entire system on behalf of each clinic. The clinic sees the results. FawrAI handles everything else.

> *"FawrAI doesn't respond. FawrAI sells. It qualifies, scores, remembers, follows up with context, handles objections, escalates intelligently, and brings cold leads back with personalised angles."*

**Tagline:** *We turn strangers into clients. And clients into loyal ones.*

**Subtitle:** *A super intelligent sales system, disguised as a conversation.*

**Positioning in one line:** The brain behind every client relationship a clinic owns.

### What FawrAI is NOT — NEVER use these words
Chatbot · bot · automation tool · software · platform · app · SaaS · AI agent · cheap · easy · quick fix · generic · broadcast · template · replacement for your team.

### Surfaces shipped so far
1. **Marketing site** — `ui_kits/marketing-site/index-v2.html` + `book.html` + `roi.html` — the canonical visual direction.
2. **Print deliverables** — Client Overview, Clinic ROI Model, Internal Margin Calculator, Sales Script (learning doc), Investor Pitch deck.
3. **ROI calculator** — `roi.html` — private, password-gated, used in person at clinic meetings.

---

## 01. Canonical visual direction (locked May 2026)

After live iteration with the founder, this is the FawrAI style. Anything we build going forward — site pages, decks, PDFs, calculators, internal dashboards — **must match this language.**

### The mood
Calm, editorial, premium. Not SaaS. Not a chatbot pitch. The page should feel like a magazine spread that happens to have an interactive product underneath.

### Surface palette

- **Hero canvas + page bg:** Off White `#F8F5F0` (brand token). Warm, not clinical.
- **Authority surfaces** (CTA cards, calculator results panel, mobile drawer, footer accents): Deep Navy `#0D2137`. Used as full-bleed cards or strips, never as the whole page.
- **Secondary warm bg:** `#EFEAE1` (offwhite-2). For panel-on-panel rhythm, footer, or section divider.
- **No gradients.** No sage-tinted hero. The hero is the brand off-white. Sage is **only** for ink (eyebrow text, italic second-line headline accents) and quiet soft-tints (e.g. pill backgrounds at ~22% alpha).
- **Gold is a reward, not a fill.** It appears at most once per viewport — on the headline number in a result card, on the dot in the logo, on a tiny status indicator. Never as background, never as a button.

### Type direction

Headlines: **Montserrat** (per brand book) — but rendered light and editorial.
- `font-weight: 400` (not 700) for most headlines.
- A **second-line italic** in `font-weight: 300` + sage ink colour, used after a period to break the headline rhythm:
  ```
  We turn strangers into clients.
  *And clients into loyal ones.*
  ```
- Heavy letterspacing tightening: `-0.022em` on display, `-0.018em` on h1, `-0.015em` on h2.
- Sizes use `clamp()` for fluid scaling.

Body: **Inter** (per brand book) — Regular / Medium.

Micro labels: **JetBrains Mono** — used **only** for small all-caps labels (eyebrows, stat labels, pill text, monospace numbers). Loaded from Google Fonts. This is an *addition* to the brand font stack, not a substitute.
- Sizes: 10.5–12px.
- Letterspacing: `0.20–0.28em`.
- Used uppercase.
- Colour: sage-ink (`#5E7558`) on light bg, `#9DB0C2` (fg-on-navy-dim) on navy.

### Sage-ink token

For ink (not bg), we use a darker shade of brand sage:
- `--sage-ink: #5E7558` — for eyebrow text, italic second-line accents.
- `--sage-soft: #E6ECE4` (brand sage-20) — for soft pill backgrounds at low alpha.
- `--sage: #8A9E85` (brand sage) — for chip backgrounds, side accents.

### The pill
The canonical eyebrow on every page is a JetBrains Mono pill:
```html
<span class="pill-sage">A super intelligent sales system, disguised as a conversation</span>
```
- 11px JetBrains Mono, 500 weight, 0.20em tracking, uppercase.
- Padding: 6px 14px.
- Background: `rgba(199, 212, 192, 0.22)` (sage at 22%).
- Border: 1px solid `--sage-soft`.
- Border-radius: 999px.
- Margin-bottom: 24–32px before the headline.

### Buttons

Primary CTA on the page is a **navy pill**:
- bg: `--ink` (navy)
- color: `--hero-bg` (offwhite)
- padding: 14px 24px
- border-radius: 999px
- font: Inter 14px, 600 weight
- hover: bg shifts to `--sage-ink`

Ghost button is **outlined navy** at 18% opacity, no fill.

**No square corners on CTAs.** Buttons are always pills.

### Cards

Two card families:

**Light card** (on the offwhite hero):
- bg: `rgba(255,255,255,0.55)` — soft, paper-like
- border: 1px solid `rgba(13,33,55,0.08)`
- border-radius: **28px** (this is the new house radius for large cards — bigger than the old 12px)
- padding: 36px 36px 32px

**Dark card** (the dramatic accent):
- bg: `--card-dark` (navy)
- border-radius: 28px
- padding: 36–40px
- Inside: gold dot indicator + JetBrains Mono label, big offwhite/gold stat, smaller compare cells.

**Buttons / pills / inputs:** rounded 12–16px, never sharp. Inputs sit on the secondary warm bg `--hero-bg-2`, no border by default, sage focus ring.

### Layout

- Max content width: **1100–1320px**, generous gutters.
- Section padding: `96px 40px` desktop · `56px 24px` mobile.
- Two-column hero (text + dark right-rail card) was tried and rejected — single-column hero is now standard.
- Forms live inline at the bottom of the same page as `#book` anchor, never on a separate route.

### Navigation

- Sticky nav, transparent until scrolled, then `rgba(248, 245, 240, 0.85)` + backdrop-blur(20px).
- **Logo only** at top-left (no wordmark text fallback — we ship the PNG mark).
- Right side: 1–2 minimal text links + one navy-pill CTA.
- Mobile: **right-side drawer** (slides in from the right, max-width `min(78vw, 320px)`), navy bg, large Montserrat menu items separated by hairlines. **Never drops from the top.** Scrim behind it at 35% navy alpha.

### Mobile rules

- All sections collapse to single column.
- All hero typography uses `clamp()` to fluid-scale.
- Bottom drawer items list the user-specified hamburger menu: **Contact us · Book a strategy call · How it works · Why FawrAI**.
- Buttons stretch to full width on phone where the design calls for it.

### Imagery & illustration

Same as v1: no stock, no AI-generated, no decorative illustrations. The single brand mark is the logo. Photography is rare, and when used must be warm Dubai-aspirational.

---

## 02. Print / PDF direction

Established through Client Overview, Clinic ROI Model, Internal Margin Calculator, Sales Script (learning doc), and the Investor Pitch deck.

### Page rhythm
- **Cover:** Navy bg, gold eyebrow pill, `font-size: 50px` Montserrat headline (this is the print equivalent of the web hero), gold rule, dim lede on `rgb(157, 176, 194)`, footer corner metadata.
- **Interior pages:** Off-white bg (`.page`) or warm offwhite-2 (`.page.soft`), navy ink, dark logo at top-left.
- **Closing page or call-to-action page:** Navy bg again for symmetry.
- **One navy page max per doc as the centrepiece** — the rest stay light. The Internal Margin Calculator follows this rule: navy cover, light interior, one soft mid-page.

### Type scale (canonical, locked)
| Role | Size | Family / weight |
|---|---|---|
| Cover h1 | **50px** (inline) | Montserrat 700 |
| Interior h1 (`h1.doc-title`) | 28pt | Montserrat 700 |
| Section head (`h2.section`) | 14pt | Montserrat 700 |
| Subsection (`h3.subsection`) | 10.5pt | Montserrat 600 |
| Eyebrow | 8.5pt, 0.20em tracking, uppercase | Inter 600, sage |
| Body | 9pt | Inter 400 |
| Body large | 9.5pt | Inter 400 |
| Lede | 11pt | Montserrat 500 |
| Big stat | 24pt | Montserrat 700 |

### Print rules
- **Strip inline `font-size` overrides** on classed elements — let the print stylesheet do the work. Inline sizes were the #1 cause of inconsistency across pages.
- **Strip `max-width` on h1.doc-title** — let sentences fit naturally on a single line, with `<br>` between sentences for two-line rhythm.
- Headlines that span two sentences break after the period with a `<br>`:
  ```
  Two tiers.
  Priced by lead volume.
  ```
- Logo at the top of every page, 14pt height, light variant on navy, dark variant on light/soft.
- Cover footer wordmark may be 20pt; everything else stays 14pt.
- Confidential docs get the diagonal gold `.confidential-stripe` in the top-right.

### Auto-print
Every PDF deliverable ships in **two copies**:
- `Foo.html` — the editable doc with a "Save as PDF" button in the corner.
- `Foo - print.html` — same content with auto-`window.print()` on load and a `display:none` rule on the print button. Use this for `open_for_print`.

---

## 03. Voice (unchanged from v1)

Direct. Warm. Confident. Never oversells. Never uses jargon to sound smart.

- Always second-person ("your clinic").
- Sentence case on headings and UI labels.
- "FawrAI" in prose (capital F). Logo renders `fawrAI.` with sage `AI` and gold `.`.
- Use real numbers ("3 seconds" beats "instant").
- One exclamation mark per document, max.

### Say / Never say
| Say | Never say |
|---|---|
| client relationship | chatbot |
| personalised | bot |
| remembers | automated messages |
| intelligent | blast / broadcast |
| fully managed | template / generic |
| converts | software / platform / app / SaaS |
| at scale | cheap / easy / quick fix |
| owned relationships | AI agent |
| sales system | just checking in |

### Tone by context
- **Marketing site** — short, editorial, italics for emphasis on the second sentence of a headline.
- **Sales materials & PDFs** — confident, data-backed, no fluff.
- **ROI calculator** — terse labels in mono, big numbers, almost no prose.
- **Internal docs** — clear and precise. Say it once and say it well.

---

## 04. Logo

There is **one canonical logo file pair**:
- `assets/logo-dark.png` — the original brand mark (navy ink, sage `AI`, gold dot). For use on **light** backgrounds (off-white, paper).
- `assets/logo-light.png` — the reversed mark (offwhite ink, sage `AI`, gold dot). For use on **dark** backgrounds (navy).

Both are tight-cropped at 3275×832px (3.94:1 ratio) — **no internal whitespace**. Set `height` in CSS, leave `width: auto`. Never set both, never set `width:auto height:auto` and expect a known size.

The same two files live in `deliverables/` and `ui_kits/marketing-site/` for path-local access. **Don't drift them.** When the logo changes, replace all six in one batch.

Web header height: ~26–32px. Print header height: 14pt. Cover footer: 20pt.

---

## 05. Iconography

(Unchanged from v1.)
- Lucide, 1.5–2px stroke, 24×24, round caps, square corners.
- `currentColor`. No emoji. No coloured illustrations.
- The gold dot in `fawrAI.` is the only true brand mark — don't reuse it as a UI accent.

---

## 06. Manifest

### Root
- `README.md` — this file. The one source of truth.
- `SKILL.md` — agent skill entry point.
- `colors_and_type.css` — every CSS variable in the system. Import into any artefact.
- `brand_book_text.md` — raw text extracted from the DOCX.

### Reference patterns to copy from
- **Web style canonical:** `ui_kits/marketing-site/index-v2.html` — the locked direction.
- **Web form pattern:** form section inside `index-v2.html` at `#book` (or standalone `book.html`).
- **Web ROI / interactive calculator:** `ui_kits/marketing-site/roi.html` — light page + dark result card + JetBrains Mono pills + sliders + tier picker + breakdown accordion.
- **PDF / print canonical:** `deliverables/Clinic ROI Model.html` + `Client Overview.html` + `Internal Margin Calculator.html`. All share `_print.css`.
- **Investor deck canonical:** `deliverables/Investor Pitch.html` (deck-stage.js).
- **Learning doc canonical:** `deliverables/Sales Script.html` — denser layout for in-meeting reference.

### Folders
- `assets/` — single logo pair (dark + light), brand colour swatches.
- `fonts/` — sourcing notes. Google Fonts CDN, confirmed.
- `ui_kits/marketing-site/` — index-v2 (web), book.html (form), roi.html (calculator), logo files, primitives.
- `ui_kits/operator-console/` — internal ops dashboard scaffold (inferred, not yet shipped).
- `preview/` — design-system tab cards.
- `deliverables/` — PDF/print outputs + their `_print.css`.
- `source_docs/` — source markdown extracts of brand DOCX and uploaded files.

---

## 07. Caveats

- **Fonts via CDN (finalised).** Montserrat + Inter + JetBrains Mono load from Google Fonts.
- **JetBrains Mono added** as the micro-label face — a brand extension agreed during product work, not from the original brand book.
- **Icons substituted.** Lucide chosen — flagged.
- **No real photography shipped** — text + colour carries every page.
- **The ROI calculator is private.** It sits behind a sessionStorage soft-gate (`fawrai2026` default code) — fine for in-meeting use but not a real auth layer.
