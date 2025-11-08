# Three-Body Problem Simulator

A web simulator of the classic three-body problem with interactive visualization and presets.  
The physics core is now implemented in **C++ + WebAssembly (WASM)** for significantly faster computation.

## 🚀 Features
- Switchable presets: Figure Eight, Sun–Earth–Jupiter, Lagrange Point L5, Kepler-16, Chaotic
- Controls: body masses, simulation speed, softening parameter ε
- Pause/resume, restart, load/save scene
- Charts of velocities and accelerations, log of local approximations

## 📂 Structure (all files in a single folder)
- `index.html` — main app page; includes scripts and styles.
- `style.css` — UI and canvas styles.
- `graphics.js` — rendering of bodies, trajectories, and scene scaling.
- `physics.js` — system state, parameters, WASM calls; JS fallback integrator.
- `simulation.js` — main simulation loop and visualization/chart updates.
- `ui.js` — presets, sliders, UI event handlers, scene import/export.
- `script.js` — utilities, including RK4 in JS as a fallback.
- `physics_wasm.cpp` — C++ core (RK4) for WebAssembly compilation.
- `physics_wasm.js` — Emscripten glue code for loading the module.
- `physics_wasm.wasm` — WebAssembly binary loaded by `physics_wasm.js`.
- `README.md` — this file with instructions.

## 🔧 WebAssembly Build

1) Install Emscripten:
```bash
# macOS/Linux:
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# Windows PowerShell:
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
emsdk install latest
emsdk activate latest
emsdk_env.ps1
```