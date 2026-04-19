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
- Google Fonts: `Frank Ruhl Libre` (headings) + `Heebo` (body)
- Inline `<style>` blocks (no external CSS files)

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

## Content Language

All visible copy is **Hebrew** (RTL). Code comments and commit messages may be in Hebrew or English.
