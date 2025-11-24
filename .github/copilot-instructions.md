**Repository Overview**

This repo is a static GitHub Pages-style site composed of plain HTML, CSS and JS. There is no build toolchain (no `package.json`, no bundler). Most pages are self-contained files under the repo root and the `botanisti.github.io-main/` copy.

**Key locations**
- **`/` (root)**: Primary set of site pages (many HTML files like `index.html`, `index1.html`, `lekuri.html`).
- **`botanisti.github.io-main/`**: A near-duplicate copy of the site. Files are mirrored (e.g. `index.html`, `README.md`). Confirm with the repo owner which directory is canonical before bulk edits.
- **`js/`**: Third-party scripts (e.g. `lightbox-plus-jquery.js`).
- **`css/`**: Helper CSS files for libraries (e.g. `lightbox.css`).
- **`files/Images/`**: Image assets used by pages.

**Big picture & intent**
- The project is a small, static website used for demonstration and GitHub Pages hosting. Pages are intentionally simple so that they are easy to edit by hand; some pages include inline JavaScript and CSS for demo functionality (for example `lekuri.html`).
- Expect content written in Finnish and multiple numbered copies of pages (e.g. `index.html`, `index1.html`..`index15.html`) — those appear to be variants or snapshots rather than programmatic versions.

**Patterns and conventions to follow**
- Files are usually edited in-place: open `*.html`, modify markup/CSS/JS and reload a browser. There is no compilation step.
- Many interactive demos keep JS inline in the HTML (see `lekuri.html` — UI + script live in the same file). When making JS changes, update the same HTML file unless you intentionally factor code into `/js/`.
- Avoid large automated reformatting: maintain existing indentation and style because many pages are hand-edited and mirrored across folders.

**Important examples to reference**
- `lekuri.html`: small single-file demo combining HTML, CSS and JS. It demonstrates UI patterns (e.g. `.symptom-bar`, `.symptom-bar-inner`) and a plain-vanilla JS approach (no frameworks). Useful to copy when adding new interactive demos.
- `js/lightbox-plus-jquery.js` and `css/lightbox.css`: example of third-party assets already included; prefer reusing these files over adding new CDN references unless asked.

**Local testing / debugging**
- Because this is static, run a local static server from the repo root to test interactions:
  - `python -m http.server 8000`
  - Then open `http://localhost:8000/lekuri.html` in your browser.
- Alternatively, use VS Code Live Server extension if available.
- Inspect interactive behavior with the browser devtools; JS is inline in many pages so use source search to find handlers (e.g. search for `addEventListener` or `renderSymptoms`).

**What to look for when editing**
- Duplication: many files exist in both the root and `botanisti.github.io-main/` folder. Confirm the canonical path before making changes that must be applied to all copies.
- Name variants: numbered `indexX.html` files are likely snapshots — ask which one is intended to be published.
- Asset references: pages reference CSS/JS files in `css/` and `js/` — keep relative paths consistent if moving files.

**When to open a discussion with maintainers**
- If you plan to: consolidate duplicated folders, migrate to a build system, or change core asset paths — open an issue / PR describing the migration and expected differences.

**Commit & PR guidance**
- Make small, focused commits with clear messages (e.g. `fix(lekuri): correct symptom bar percent calculation`).
- Provide a short PR description that lists the files changed and the manual steps to test (local URL, what to click).

If anything above is unclear or you want me to prefer one directory (`/` vs `botanisti.github.io-main/`) as the canonical source, tell me which and I will update this file accordingly.
