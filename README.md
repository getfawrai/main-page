# FawrAI Website

Static marketing site for FawrAI (single page: hero, Meet Hala, How it works, What you get, Why Hala, Book a strategy call, integrations, footer). Light theme, all sections left-aligned.

## Files

Everything is flat — no subfolders — because this repo gets deployed to GitHub Pages by uploading files individually, and GitHub's upload UI flattens any folder structure if you don't drag whole folders in. Keeping the project flat locally means what you see here is exactly what should exist in the repo, no path surprises.

- `index.html` — page markup. Plain HTML, no build step.
- `site.css` — all layout and component styles. References CSS variables defined in `colors_and_type.css`, which must be loaded first (it is, in `index.html`'s `<head>`).
- `colors_and_type.css` — FawrAI's design-system tokens (colors, type scale, spacing, mobile breakpoints). Pulled from the design system project; treat as generated, not hand-edited.
- `script.js` — vanilla JS: sticky nav blur on scroll, mobile drawer, "How it works" accordion, book-a-call form (fake submit → success message swap, no backend).
- `logo-dark.png`, `logo-light.png` — logo lockups. The current light theme uses `logo-dark.png` in the nav and footer.

**Important:** if you ever add a file that needs to live in a subfolder, you must drag the actual folder into GitHub's upload UI (not select files from inside it one by one) — otherwise it lands flattened in the repo root and every relative path referencing it breaks. This bit us once already (see git history around 2026-07-28).

## Where this came from

The source design lives at claude.ai/design (project "FawrAI website redesign", file `FawrAI Website.dc.html`). That export uses a template format (`{{ }}` bindings, `sc-for`/`sc-if` tags, a React-based runtime) that only renders inside the Design tool's own sandbox — it doesn't work as a plain webpage. `index.html`/`site.css`/`script.js` here are a from-scratch, framework-free reimplementation of that same design (same copy, same colors, same layout, same interactions) that runs in any browser with no build step.

If the design changes again in claude.ai/design, the fix is the same each time: pull the updated `FawrAI Website.dc.html` (and `colors_and_type.css` if it changed), diff it against what's here, and port the content/style changes into `index.html`/`site.css` by hand — don't just drop the `.dc.html` in as-is.

## Running locally

No build step — it's plain files. Easiest way to preview with working relative paths (opening `index.html` directly via `file://` can hit browser sandboxing issues):

```bash
cd "/Users/arbresheabdiu/Downloads/FawrAI website redesign"
python3 -m http.server 4567
```

Then open `http://localhost:4567`.

There's also a `fawrai-website` entry in `~/.claude/launch.json` that serves the working copy at `~/Fawrai/website` on port 4567 (macOS blocks Claude's preview tooling from serving directly out of `~/Downloads`, hence the separate copy).

## Other copies of this project

- `~/Fawrai/website` — working copy kept in sync with this folder, used for local preview/testing.
- `~/Fawrai/website-v2-light` — a snapshot of the current light-theme, left-aligned version, saved as a separate reference point.

This folder (`~/Downloads/FawrAI website redesign`) is the one to edit — copy changes to the others manually if you need them updated too.
