# Repository Guidelines

## Project Structure & Module Organization

This repository is a dependency-free static project page for the UMM Transferability paper. `index.html` contains page content and semantic structure, `style.css` owns layout, responsive behavior, and design tokens, and `script.js` implements progress, scroll-spy, carousel, lightbox, image fallbacks, and BibTeX copying. Store web figures in `assets/`; keep poster source/export files at the root only when they are intentionally published. `README.md` provides the paper summary and links. Treat `STYLESEED.md` as the UI design source of truth.

## Build, Test, and Development Commands

No package installation or build step is required. From the repository root, use:

```bash
python3 -m http.server 8000
node --check script.js
```

Open `http://localhost:8000` to review the site with real relative-path and CDN behavior. The Node command performs a JavaScript syntax check. Before committing, also run `git diff --check` to catch whitespace errors and inspect `git status --short` so unrelated artifacts are not included.

## Coding Style & Naming Conventions

Follow the existing two-space indentation in HTML and JavaScript and compact CSS formatting. Use semantic, kebab-case class names (`hero-carousel`, `figure-error`) and camelCase JavaScript identifiers (`updateProgress`). Prefer `const`; use `let` only for changing state. Keep behavior inside the existing strict-mode IIFE and group related code with short section comments. Use relative asset paths and meaningful `alt` text.

For visual work, re-read `STYLESEED.md`. Preserve one muted slate-blue accent through CSS variables, grayscale supporting surfaces, the soft radius scale, restrained shadows (8% opacity or less), and an 8px spacing rhythm. Do not introduce pure black, emoji icons, arbitrary hex colors, or a second visual system. Maintain visible focus rings, 44px touch targets, responsive body text of at least 16px on desktop, and `prefers-reduced-motion` handling.

## Testing Guidelines

There is no automated test suite. Manually check desktop and narrow mobile widths, sidebar navigation, carousel arrows/dots and keyboard controls, lightbox open/close behavior, BibTeX copying, external links, image loading/fallbacks, and the browser console. Verify keyboard focus and reduced-motion mode after interaction changes.

## Commit & Pull Request Guidelines

History favors short imperative, scope-first subjects such as `hero: ...`, `Page polish: ...`, and `fix bug and typos`. Keep each commit focused and describe the visible outcome. Pull requests should summarize the change, list manual checks, link the relevant issue or paper update, and include before/after screenshots for layout or asset changes. Avoid committing `.DS_Store` or unrelated generated files.
