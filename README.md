# Three-Body Problem Web Simulator (C++ → WebAssembly)

Interactive, high‑performance browser simulation of the classic three‑body problem.  
The physics core is written in C++ and compiled to WebAssembly (WASM) via Emscripten; the UI is vanilla JavaScript.

## Quick Start

> You only need a **static web server** (no backend).

1. **Clone or download** this project to your machine.
2. **Start a local server** from the project folder:
   ```bash
   # Option A: Python 3
   python -m http.server 8000

   # Option B: Node.js (if installed)
   npx http-server . -p 8000
   ```
3. **Open** your browser at **http://localhost:8000**.

That’s it — the scene, controls, and charts should load in the browser.

## Requirements

- Modern browser (Chrome, Firefox, Safari, Edge)
- Any simple static server (e.g., Python 3 or Node’s http-server)

## Project Structure (high level)

- `index.html` — app shell and UI
- `main.js`, `ui.js` — initialization and controls
- `physics.wasm`, `physics.js` — C++ core compiled to WASM (via Emscripten)
- `assets/` — styles, icons, presets, etc.

## Notes

- Serve the files over HTTP/HTTPS. Opening via **file://** will not load WASM.
- If you rebuilt `physics.wasm`, clear the browser cache or hard‑reload.
