# CLAUDE.md — עו"ד צחי לביא

## Project Overview

Static Hebrew law-firm website for attorney Tzachi Lavia (עו"ד צחי לביא), specializing in personal injury (נזיקין) and medical malpractice (רשלנות רפואית). Based in Ashkelon, Israel. 14+ years experience.

**Live URL:** https://tzachilavi101-prog.github.io/tsachi-lavia-law/  
**GitHub:** https://github.com/tzachilavi101-prog/tsachi-lavia-law.git  
**Hosting:** GitHub Pages (branch: `main`)

---

## Tech Stack

- Pure static HTML/CSS/JS — no build system, no framework, no npm
- All pages are standalone `.html` files
- RTL layout (`dir="rtl"`, `lang="he"`)
- Google Fonts: `Assistant` (wght 200/300/400 — entire site) + `Noto Serif Hebrew` (Hebrew-glyph fallback)
- `style.css` — global design tokens (`:root` CSS variables); linked in every page's `<head>`
- Inline `<style>` blocks per page for page-specific rules; consume tokens via `var(--...)`

---

## Design System

| Token | Value |
|---|---|
| `--bg-primary` | `#0b0b0f` |
| `--bg-secondary` | `#131318` |
| `--bg-tertiary` | `#1a1a22` |
| `--accent` | `#c8956c` (warm gold) |
| `--accent-hover` | `#d9a97e` |
| `--text-primary` | `#e8e4df` |
| `--text-secondary` | `#7a7a84` |
| `--text-heading` | `#ffffff` |
| `--radius` | `16px` |
| `--container` | `1100px` |

Dark theme, warm accent (`#c8956c`), glassmorphism cards (`rgba` backgrounds + subtle borders).

---

## File Structure

```
index.html                          — Main landing page
article-birth-malpractice.html      — Article: birth malpractice
article-cancer-diagnosis.html       — Article: cancer diagnosis delay
article-car-accident-malpractice.html — Article: car accident malpractice
article-medical-malpractice-signs.html — Article: signs of medical malpractice
accessibility.html                  — Accessibility statement
sitemap.xml
robots.txt
images/                             — Image assets
```

---

## Key Decisions & History

- **Hero section cleanup:** Decorative circle orbs and portrait image were removed from the hero section for a cleaner look (commits `56901c9`, `c9fa1dd`).
- **No portrait in hero:** The circular portrait was explicitly removed — do not re-add it to the hero.
- **Article pages:** Four long-form article pages were added for SEO content.
- **Schema.org:** `LegalService` structured data is embedded in `index.html` for local SEO.
- **Phone:** `+972-54-233-6262`
- **Address:** הגדוד העברי 10, אשקלון סנטר

---

## Deployment

Push to `main` → GitHub Pages auto-deploys. No CI/CD pipeline needed.

```bash
git add <files>
git commit -m "..."
git push origin main
```

---

## Global Tokens (style.css)

| Variable | Value | Used for |
|---|---|---|
| `--font-primary` | `'Assistant', 'Noto Serif Hebrew', sans-serif` | All body text, UI, forms |
| `--font-heading` | `'Assistant', 'Noto Serif Hebrew', sans-serif` | h1–h3 (set per page) |
| `--font-body` | `var(--font-primary)` | `body`, buttons, inputs |

**To change the site font:** edit `--font-primary` in `style.css` only.  
**Font weights in use:** 200 (attorney name display), 300 (body copy), 400 (UI elements, TL mark).

---

## Commands

- **Preview**: `npm run preview` — serves the site locally via `npx serve .`
- **Lint articles**: `npm run lint:articles` — validates all `article-*.html` files (disclaimer, SEO meta, H1 count, semantic tags, indentation). Exits with code 1 if any file fails; run before committing article changes.

## Code Style & Guidelines

- **HTML**: Use semantic HTML5 tags. Maintain accessibility (ARIA labels) on interactive elements.
- **Naming**: Use kebab-case for all file names (e.g., `article-medical-malpractice.html`).
- **Formatting**: 2-space indentation. Keep `<meta>` tags (title, description, OG) updated for SEO on every page.
- **Inline styles**: All CSS lives in `<style>` blocks within each HTML file — no external `.css` files.
- **Validation**: Run `html-validator` before committing to catch syntax errors.

---

## Critical Content Rules

- All articles must maintain a **professional legal tone**.
- Every article page must include a **disclaimer footer** (e.g., "האמור אינו מהווה ייעוץ משפטי").
- Do **not** re-add the circular portrait to the hero section — it was intentionally removed.

---

## Content Language

All visible copy is **Hebrew** (RTL). Code comments and commit messages may be in Hebrew or English.
