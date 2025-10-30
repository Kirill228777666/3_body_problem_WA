# Three-Body Problem Simulator

Веб-симулятор классической задачи трёх тел с интерактивной визуализацией и пресетами.  
Теперь физическое ядро вынесено в **C++ + WebAssembly (WASM)** для существенного ускорения вычислений.

## 🚀 Возможности
- Переключаемые пресеты: Figure Eight, Sun–Earth–Jupiter, Lagrange Point L5, Kepler-16, Chaotic
- Регулировки: массы тел, скорость симуляции, параметр смягчения ε
- Пауза/возобновление, перезапуск, загрузка/сохранение сцены
- Графики скоростей и ускорений, лог локальных аппроксимаций

## 📂 Структура
- `index.html` — страница и подключение всех скриптов; старт симуляции, когда готов и UI, и WASM
- `style.css` — стили (не входит в этот набор файлов)
- `graphics.js` — отрисовка тел, орбит, масштабирование/границы
- `physics.js` — состояние системы, параметры; **интегрирование — через WASM** (есть JS-фолбэк)
- `simulation.js` — главный цикл симуляции + обновление графиков раз в 500 мс
- `ui.js` — пресеты, слайдеры, импорт/экспорт сцены, лог формул, UI события
- `script.js` — утилиты (в т.ч. RK4 на JS как фолбэк)
- `physics_wasm.cpp` — **C++ ядро** (интегрирование RK4), компилируется в WebAssembly `physics_wasm.js/.wasm`

## 🔧 Сборка WebAssembly

1) Установите Emscripten:
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
