function bodyNameFromIndex(i){
  try {
    var name = (window.physics && physics.initialConditions && physics.initialConditions.currentPresetName) || '';
    var circles = (name === "FigureEight" || name === "Chaotic");
    if (circles) return ["Тело 1 (красное)","Тело 2 (синее)","Тело 3 (зелёное)"][i] || "Тело";
    return ["Солнце","Земля","Юпитер"][i] || "Тело";
  } catch(e) {
    return ["Тело 1","Тело 2","Тело 3"][i] || "Тело";
  }
}

var cssHelper = (function(){
  function hasClass(element, className) {
    return (' ' + element.className + ' ').indexOf(' ' + className + ' ') > -1;
  }
  function removeClass(element, className) {
    element.className = element.className.replace(new RegExp('(?:^|\\s)' + className + '(?:\\s|$)'), ' ').trim();
  }
  function addClass(element, className) {
    if (hasClass(element, className)) return;
    element.className = (element.className + " " + className).trim();
  }
  return { hasClass, removeClass, addClass };
})();

var simulations = (function(){
  var content = { didChangeModel: null };
  var vigure8Position = {x: 0.97000436, y: -0.24308753};
  var vigure8Velocity = {x: -0.93240737, y: -0.86473146};

  function polarFromCartesian(c){
    var angle = (c.x === 0 && c.y === 0) ? 0 : Math.atan2(c.y, c.x);
    return { r: Math.sqrt(c.x*c.x + c.y*c.y), theta: angle };
  }

  var allPresets = {
    "FigureEight": {
      name: "FigureEight",
      dimensionless: true,
      masses: [1,1,1],
      massSlider: { min: 0.1, max: 5, power: 3 },
      timeScaleFactor: 1,
      timeScaleFactorSlider: { min: 0.00, max: 20, power: 1 },
      positions: [
        polarFromCartesian(vigure8Position),
        polarFromCartesian({x:-vigure8Position.x, y:-vigure8Position.y}),
        polarFromCartesian({x:0,y:0})
      ],
      velocities: [
        polarFromCartesian({x:-vigure8Velocity.x/2, y:-vigure8Velocity.y/2}),
        polarFromCartesian({x:-vigure8Velocity.x/2, y:-vigure8Velocity.y/2}),
        polarFromCartesian(vigure8Velocity)
      ]
    },
    "SunEarthJupiter": {
      name: "SunEarthJupiter",
      masses: [1.98855e30, 5.972e24, 1.898e27],
      densities: [0.01,0.01,0.01],
      massSlider: { min: 3e10, max: 3e31, power: 5 },
      timeScaleFactor: 3600*24*30,
      timeScaleFactorSlider: { min: 0, max: 3600*24*365*1000, power: 5 },
      positions: [{r:0,theta:0},{r:1.496e11,theta:0},{r:7.78e11,theta:0}],
      velocities: [{r:0,theta:Math.PI/2},{r:30e3,theta:Math.PI/2},{r:13.1e3,theta:Math.PI/2}]
    },
    "LagrangePoint5": {
      name: "LagrangePoint5",
      masses: [1.98855e30, 1.898e27, 1e21], // Солнце, Юпитер, Астероид
      densities: [1410, 1330, 2000],
      paleOrbitalPaths: true,
      massSlider: { min: 3e10, max: 3e31, power: 5 },
      timeScaleFactor: 3600*24*365*2, // 2 года в секунду
      timeScaleFactorSlider: { min: 0, max: 3600*24*365*20, power: 3 },
      positions: [
        {r:0,theta:0}, // Солнце
        {r:7.78e11,theta:0}, // Юпитер
        {r:7.78e11,theta:-Math.PI/3} // Астероид в L5
      ],
      velocities: [
        {r:0,theta:0}, // Солнце (система будет отцентрована по барицентру)
        {r:13.1e3,theta:Math.PI/2}, // Орбитальная скорость Юпитера
        {r:13.1e3,theta: -Math.PI/3 + Math.PI/2} // Орбитальная скорость астероида
      ]
    },
    "Kepler16": {
      name: "Kepler16",
      masses: [0.6897*1.98855e30, 0.20255*1.98855e30, 0.3333*1.898e27],
      massSlider: { min: 3e10, max: 3e31, power: 5 },
      timeScaleFactor: 3600*24*10,
      timeScaleFactorSlider: { min: 0, max: 3600*24*365*15, power: 5 },
      positions: [
        { r:(0.20255*0.22431*1.496e11)/(0.6897+0.20255), theta:0 },
        { r:(0.6897*0.22431*1.496e11)/(0.6897+0.20255), theta:Math.PI },
        { r:0.7048*1.496e11, theta:0 }
      ],
      velocities: [{r:13e3,theta:Math.PI/2},{r:44e3,theta:3*Math.PI/2},{r:33e3,theta:Math.PI/2}]
    },
    "Chaotic": {
      name: "Chaotic",
      dimensionless: true,
      masses: [1,1,1],
      massSlider: { min: 0.1, max: 10, power: 3 },
      timeScaleFactor: 3.9335,
      timeScaleFactorSlider: { min: 0.00, max: 20, power: 1 },
      positions: [{r:1,theta:0},{r:1,theta:2*Math.PI/3},{r:1,theta:4*Math.PI/3}],
      velocities: [{r:0.55,theta:Math.PI/2},{r:0.55,theta:2*Math.PI/3+Math.PI/2},{r:0.55,theta:4*Math.PI/3+Math.PI/2}]
    }
  };

  function didClickElement(el){
    if(!el) return;
    if(!cssHelper.hasClass(el,"ThreeBodyProblem-preset")){
      if(el.parentElement) didClickElement(el.parentElement);
      return;
    }
    var name = el.getAttribute("data-name");
    var preset = allPresets[name];
    if (content.didChangeModel && preset) { content.didChangeModel(preset); }
    var presetEls = document.querySelectorAll(".ThreeBodyProblem-preset");
    for (var i=0;i<presetEls.length;i++) cssHelper.removeClass(presetEls[i],'ThreeBodyProblem-button--isSelected');
    cssHelper.addClass(el,"ThreeBodyProblem-button--isSelected");
  }

  function didClick(e){ e = e || window.event; if (e.target) didClickElement(e.target); }

  function init(){
    var presetEls = document.querySelectorAll(".ThreeBodyProblem-preset");
    for (var i=0;i<presetEls.length;i++) presetEls[i].onclick = didClick;
    return allPresets.FigureEight;
  }

  return { init, content };
})();

var oddPowerCurve = (function(){
  function calcualteL(d,p){ if(p===0)return 1; return -Math.pow(d,1/p); }
  function calcualteA(d,p){ if(p===0)return 1; return Math.pow(1-d,1/p)-calcualteL(d,p); }
  function sliderOutputValue(d,input,p){
    if(p===0) return 1;
    var a = calcualteA(d,p), l = calcualteL(d,p);
    var res = Math.pow(a*input+l,p)+d;
    if(res<0) res=0;
    return res;
  }
  return { sliderOutputValue, calcualteA, calcualteL };
})();

var logManager = (function() {
  var approximationLog = [];
  var simulationTime = 0;
  var lastLogTimestamp = 0;
  var logInterval = 100;

  function clear() {
    approximationLog = [];
    simulationTime = 0;
    lastLogTimestamp = 0;
    for (let i = 0; i < 3; i++) {
      const formulaEl = document.getElementById('formula-text-' + i);
      if (formulaEl) formulaEl.innerHTML = '';
    }
  }

  function update(currentTime, simulatedTimeDelta) {
    if (currentTime - lastLogTimestamp < logInterval) return;
    lastLogTimestamp = currentTime;
    simulationTime += simulatedTimeDelta;

    const allAccs = physics.getAccelerations && physics.getAccelerations();
    if (!allAccs || allAccs.length === 0) return;

    var currentLogBlock = `Moment of Time: ${simulationTime.toFixed(3)}s\n`;

    for (let bodyIndex = 0; bodyIndex < 3; bodyIndex++) {
      const formulaEl = document.getElementById('formula-text-' + bodyIndex);
      const i = bodyIndex * 4;

      const currentPos = { x: physics.state.u[i], y: physics.state.u[i + 1] };
      const currentVel = { x: physics.state.u[i + 2], y: physics.state.u[i + 3] };
      const currentAcc = allAccs[bodyIndex];

      const fmt = (num) => (num === 0 ? "0.00e+0" : Number(num).toExponential(2));

      if (formulaEl) {
        formulaEl.innerHTML =
          `${bodyNameFromIndex(bodyIndex)}:\n` +
          `x(Δt) ≈ ${fmt(currentPos.x)} + ${fmt(currentVel.x)}*Δt + 0.5*(${fmt(currentAcc.ax)})*Δt²\n` +
          `y(Δt) ≈ ${fmt(currentPos.y)} + ${fmt(currentVel.y)}*Δt + 0.5*(${fmt(currentAcc.ay)})*Δt²`;
      }

      currentLogBlock += `\n${bodyNameFromIndex(bodyIndex)}:\n`;
      currentLogBlock += `  x(Δt) ≈ ${currentPos.x} + ${currentVel.x}*Δt + 0.5*(${currentAcc.ax})*Δt²\n`;
      currentLogBlock += `  y(Δt) ≈ ${currentPos.y} + ${currentVel.y}*Δт + 0.5*(${currentAcc.ay})*Δt²`;
    }

    approximationLog.push(currentLogBlock);
  }

  function download() {
    if (approximationLog.length === 0) {
      alert("Лог пуст. Запустите симуляцию, чтобы собрать данные.");
      return false;
    }
    const fileContent = approximationLog.join('\n' + '-'.repeat(70) + '\n\n');
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'approximation_log.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return { clear, update, download };
})();

var userInput = (function(){
  var sliderLabelElement = document.querySelector(".ThreeBodyProblem-sliderLabel");
  var sliderElement = document.querySelector(".ThreeBodyProblem-slider");
  var sceneContainer = document.querySelector(".ThreeBodyProblem-container");
  var currentSlider="speed", currentMassSliderIndex=0, currentModel;
  var downloadSceneButton = document.getElementById('download-scene-button');
  var uploadSceneButton = document.getElementById('upload-scene-button');
  var sceneUploader = document.getElementById('scene-uploader');
  var downloadLogButton = document.getElementById('download-log-button');
  var infoModal = document.getElementById('info-modal');
  var infoButton = document.getElementById('info-button');
  var closeModalButton = document.querySelector('.modal-close-button');
  var sliderInst = null;

  function getSofteningSliderSettings(isDimensionless){
    return isDimensionless
      ? { min: -3, max: 0, power: 1, defaultLogEpsilon: -1 }
      : { min: 5, max: 8, power: 1, defaultLogEpsilon: Math.log10(Math.sqrt(4.06e13)) };
  }

  function getCurrentSliderSettings(){
    if (currentSlider==="mass") return physics.initialConditions.massSlider;
    if (currentSlider==="speed") return physics.initialConditions.timeScaleFactorSlider;
    if (currentSlider==="softening") return getSofteningSliderSettings(physics.initialConditions.dimensionless);
    return { min:0, max:1, power:1 };
  }

  function roundSliderValueText(v){
    var r = Math.round(v*10000)/10000;
    return parseFloat(r).toFixed(4);
  }

  function formatSofteningForSlider(eps){
    var formatted = eps.toExponential(4);
    var unit = physics.initialConditions.dimensionless ? "" : " м";
    return "Смягчение ε: " + formatted + unit;
  }

  function formatMassForSlider(m){
    var f = roundSliderValueText(m);
    if (m>10000 || (m<0.001 && m!==0)) f = m.toExponential(4);
    var txt = "Масса " + bodyNameFromIndex(currentMassSliderIndex) + ": " + f;
    if (physics.initialConditions.dimensionless !== true) txt += " кг";
    return txt;
  }

  function timeHumanReadable(t){
    var res = { unit:'секунда', value:t };
    if (res.value < 60) return res;
    res.value/=60; res.unit='минута'; if (res.value<60) return res;
    res.value/=60; res.unit='час';    if (res.value<24) return res;
    res.value/=24; res.unit='день';   if (res.value<365) return res;
    res.value/=365; res.unit='год';   if (res.value<100) return res;
    res.value/=100; res.unit='век';   if (res.value<10) return res;
    res.value = Math.floor(res.value*10)/10;
    return res;
  }

  function formatTimescaleForSlider(v){
    var h = timeHumanReadable(v);
    var f = roundSliderValueText(h.value);
    if (h.value>10000 || (h.value<0.001 && h.value!==0)) f = h.value.toExponential(4);
    return "Скорость симуляции: " + f + " " + h.unit + " в секунду";
  }

  function getCurrentSimulationValue(){
    if (currentSlider==="mass") return physics.initialConditions.masses[currentMassSliderIndex];
    if (currentSlider==="speed") return physics.initialConditions.timeScaleFactor;
    if (currentSlider==="softening"){
      var s = getSofteningSliderSettings(physics.initialConditions.dimensionless);
      var epsSq = physics.initialConditions.softeningParameterSquared;
      var eps;
      if (epsSq && epsSq>0){ eps = Math.sqrt(epsSq); }
      else { eps = Math.pow(10, s.defaultLogEpsilon); physics.initialConditions.softeningParameterSquared = eps*eps; }
      return Math.log10(eps);
    }
    return 0;
  }

  function normalizedFromValue(value, sliderSettings){
    var t = (value - sliderSettings.min) / (sliderSettings.max - sliderSettings.min);
    if (!isFinite(t)) t = 0;
    if (t < 0) t = 0; if (t > 1) t = 1;
    var p = sliderSettings.power;
    if (!p || p === 1) return t;
    if (p % 2 === 0) {
      return Math.pow(t, 1/p);
    } else {
      var d = 0.5;
      var lo = 0, hi = 1, iter = 0;
      while (iter < 40) {
        var mid = 0.5 * (lo + hi);
        var f = oddPowerCurve.sliderOutputValue(d, mid, p);
        if (f < t) lo = mid; else hi = mid;
        iter++;
      }
      return 0.5 * (lo + hi);
    }
  }

  function didUpdateSlider(sliderValue){
    var sliderSettings = getCurrentSliderSettings();
    if (sliderSettings.power !== undefined && sliderSettings.power !== 1) {
      if (sliderSettings.power % 2 === 1) {
        var d = 0.5;
        sliderValue = oddPowerCurve.sliderOutputValue(d, sliderValue, sliderSettings.power);
      } else {
        sliderValue = Math.pow(sliderValue, sliderSettings.power);
      }
      sliderValue = Math.max(0, Math.min(1, sliderValue));
    }
    var newValue = sliderSettings.min + (sliderSettings.max - sliderSettings.min) * sliderValue;
    var sliderText;
    if (currentSlider === "mass") {
      newValue = Math.round(newValue*10000)/10000;
      physics.initialConditions.masses[currentMassSliderIndex] = newValue;
      graphics.updateObjectSizes(physics.calculateDiameters());
      sliderText = formatMassForSlider(newValue);
    } else if (currentSlider === "speed") {
      newValue = Math.round(newValue*10000)/10000;
      physics.initialConditions.timeScaleFactor = newValue;
      sliderText = formatTimescaleForSlider(newValue);
    } else if (currentSlider === "softening") {
      var eps = Math.pow(10, newValue);
      physics.initialConditions.softeningParameterSquared = eps*eps;
      sliderText = formatSofteningForSlider(eps);
    } else {
      sliderText = "Неизвестный ползунок";
    }
    if (sliderLabelElement) sliderLabelElement.innerText = sliderText;
  }

  function syncSliderHeadToValue(){
    if (!sliderInst) return;
    var settings = getCurrentSliderSettings();
    var value = getCurrentSimulationValue();
    var norm = normalizedFromValue(value, settings);
    sliderInst.setNormalizedValue(norm, true);
  }

  function resetSlider(){
    cssHelper.removeClass(sliderElement,"ThreeBodyProblem-sliderSun");
    cssHelper.removeClass(sliderElement,"ThreeBodyProblem-sliderEarth");
    cssHelper.removeClass(sliderElement,"ThreeBodyProblem-sliderJupiter");
    var val = getCurrentSimulationValue();
    var txt;
    if (currentSlider==="mass"){
      txt = formatMassForSlider(val);
      if (currentMassSliderIndex===0) cssHelper.addClass(sliderElement,"ThreeBodyProblem-sliderSun");
      else if (currentMassSliderIndex===1) cssHelper.addClass(sliderElement,"ThreeBodyProblem-sliderEarth");
      else if (currentMassSliderIndex===2) cssHelper.addClass(sliderElement,"ThreeBodyProblem-sliderJupiter");
    } else if (currentSlider==="speed"){
      txt = formatTimescaleForSlider(val);
    } else if (currentSlider==="softening"){
      var eps = Math.pow(10,val);
      txt = formatSofteningForSlider(eps);
    } else {
      txt = "Неизвестный ползунок";
    }
    if (sliderLabelElement) sliderLabelElement.innerText = txt;
    syncSliderHeadToValue();
  }

  function updateMassButtonsAppearance(useCircles){
    if (useCircles) {
      cssHelper.addClass(sceneContainer, 'is-circles-mode');
    } else {
      cssHelper.removeClass(sceneContainer, 'is-circles-mode');
    }
    graphics.setCircleMode(!!useCircles);
  }

  function didChangeModel(model){
    currentModel = model;
    physics.changeInitialConditions(currentModel);
    var presetEls = document.querySelectorAll(".ThreeBodyProblem-preset");
    if (model.name === "Custom") {
      for (var i=0; i<presetEls.length; i++) cssHelper.removeClass(presetEls[i],'ThreeBodyProblem-button--isSelected');
    }
    var useCircles = (model.name==="FigureEight" || model.name==="Chaotic");
    updateMassButtonsAppearance(useCircles);
    didClickRestart();
    currentSlider = "speed";
    resetSlider();
  }

  function didClickRestart(){
    logManager.clear();
    physics.resetStateToInitialConditions();
    graphics.clearScene(physics.largestDistanceMeters());
    graphics.updateObjectSizes(physics.calculateDiameters());
    if (window.chartManager) {
      if (typeof window.chartManager.reset === 'function') window.chartManager.reset();
    }
    return false;
  }

  function didClickMass(i){ currentSlider="mass"; currentMassSliderIndex=i; resetSlider(); return false; }
  function didClickSpeed(){ currentSlider="speed"; resetSlider(); return false; }
  function didClickSoftening(){ currentSlider="softening"; resetSlider(); return false; }

  function didClickDownloadScene() {
    var sceneData = {
      name: "Custom Scene",
      dimensionless: physics.initialConditions.dimensionless,
      masses: physics.initialConditions.masses,
      positions: physics.initialConditions.positions,
      velocities: physics.initialConditions.velocities,
      timeScaleFactor: physics.initialConditions.timeScaleFactor,
      softeningParameterSquared: physics.initialConditions.softeningParameterSquared
    };
    var jsonString = JSON.stringify(sceneData, null, 2);
    var blob = new Blob([jsonString], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'three-body-scene.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return false;
  }

  function didClickUploadScene() { sceneUploader.click(); return false; }

  function handleFileUpload(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var scene = JSON.parse(e.target.result);
        if (!scene || !scene.masses || !scene.positions || !scene.velocities) {
          alert("Неверный файл сцены."); return;
        }
        scene.name = scene.name || "Custom";
        simulations.content.didChangeModel(scene);
      } catch (err) { alert("Ошибка чтения файла: " + err.message); }
    };
    reader.readAsText(file);
  }

  function populateInfoModal() {
    var container = document.querySelector('.instruction-container');
    if (!container) return;
    container.innerHTML = `
      <h2>Руководство по симулятору</h2>
      <p>Этот симулятор моделирует движение трёх тел под действием взаимного гравитационного притяжения, используя для расчётов WebAssembly-модуль на C++.</p>
      
      <h3>Основное управление</h3>
      <ul>
        <li><b>Пауза / Продолжить:</b> Приостанавливает или возобновляет симуляцию.</li>
        <li><b>Перезапуск:</b> Сбрасывает текущий пресет к его начальным параметрам.</li>
        <li><b>Слайдер:</b> Центральный элемент управления. Его функция меняется в зависимости от выбранной ниже кнопки (масса, скорость или смягчение).</li>
      </ul>

      <h3>Параметры симуляции (кнопки слева)</h3>
      <ul>
        <li><b>Кнопки масс:</b> Нажмите на иконку тела (планеты или цветного кружка), чтобы выбрать его. После этого слайдер будет регулировать массу этого тела.</li>
        <li><b>Скорость:</b> Нажмите на иконку часов, чтобы слайдер управлял скоростью течения времени в симуляции.</li>
        <li><b>Смягчение (\\(\\epsilon\\)):</b> Это небольшой параметр, который предотвращает "взрыв" симуляции, когда тела подходят слишком близко друг к другу. Он сглаживает силу гравитации на малых расстояниях, избегая деления на ноль.</li>
        <li><b>Информация:</b> Открывает это окно.</li>
      </ul>

      <h3>Пресеты</h3>
      <ul>
        <li><b>Восьмёрка:</b> Классическое, периодическое решение задачи трёх тел, где три тела с равными массами движутся по стабильной траектории в форме восьмёрки.</li>
        <li><b>Солнце, Земля и Юпитер:</b> Упрощённая модель нашей Солнечной системы. Показывает, как массивный Юпитер влияет на орбиту Земли и барицентр системы.</li>
        <li><b>Точка Лагранжа L5:</b> Демонстрация одной из пяти точек стабильности в системе двух массивных тел (Солнце-Юпитер). Третье, малое тело (астероид) может оставаться в этой точке почти неподвижно относительно вращающейся системы.</li>
        <li><b>Кеплер-16:</b> Модель реальной экзопланетной системы, где планета вращается сразу вокруг двух звёзд (является спутником двойной звезды).</li>
        <li><b>Хаотический:</b> Пример нестабильной системы, иллюстрирующий главную сложность задачи трёх тел: малейшие изменения в начальных условиях приводят к совершенно непредсказуемым траекториям.</li>
      </ul>
      
      <h3>Дополнительные возможности</h3>
      <ul>
        <li><b>Скачать / Загрузить сцену:</b> Вы можете сохранить текущее состояние симуляции (массы, положения, скорости) в файл и загрузить его позже, чтобы продолжить эксперименты.</li>
        <li><b>Графики и аппроксимации:</b> Ниже расположены раскрывающиеся блоки, которые в реальном времени показывают графики скоростей и ускорений тел, а также мгновенные математические формулы, аппроксимирующие их движение.</li>
      </ul>
    `;
    if (window.MathJax && typeof window.MathJax.typeset === 'function') {
      window.MathJax.typeset([container]);
    }
  }

  function handleModal() {
    function openModal() { if (infoModal) infoModal.classList.remove('is-hidden'); }
    function closeModal() { if (infoModal) infoModal.classList.add('is-hidden'); }
    if (infoButton) infoButton.addEventListener('click', function(e) { e.preventDefault(); openModal(); });
    if (closeModalButton) closeModalButton.addEventListener('click', closeModal);
    if (infoModal) infoModal.addEventListener('click', function(e) { if (e.target === infoModal) closeModal(); });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && !infoModal.classList.contains('is-hidden')) closeModal();
    });
  }

  function attachEvents(){
    sliderInst = new SickSlider(".ThreeBodyProblem-slider");
    sliderInst.onSliderChange = didUpdateSlider;
    var el;
    el = document.querySelector(".ThreeBodyProblem-mass1Button"); if (el) el.onclick = function(e){ e.preventDefault(); return didClickMass(0); };
    el = document.querySelector(".ThreeBodyProblem-mass2Button"); if (el) el.onclick = function(e){ e.preventDefault(); return didClickMass(1); };
    el = document.querySelector(".ThreeBodyProblem-mass3Button"); if (el) el.onclick = function(e){ e.preventDefault(); return didClickMass(2); };
    el = document.querySelector(".ThreeBodyProblem-speedButton"); if (el) el.onclick = function(e){ e.preventDefault(); return didClickSpeed(); };
    el = document.querySelector(".ThreeBodyProblem-softeningButton"); if (el) el.onclick = function(e){ e.preventDefault(); return didClickSoftening(); };
    el = document.querySelector(".ThreeBodyProblem-reload"); if (el) el.onclick = function(e){ e.preventDefault(); return didClickRestart(); };
    var pauseBtn = document.querySelector('.ThreeBodyProblem-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (simulation.isPaused()) {
          simulation.resume();
          pauseBtn.textContent = 'Пауза';
          pauseBtn.setAttribute('aria-pressed','false');
        } else {
          simulation.pause();
          pauseBtn.textContent = 'Продолжить';
          pauseBtn.setAttribute('aria-pressed','true');
        }
      }, { passive: false });
    }
    if (downloadSceneButton) downloadSceneButton.onclick = function(e){ e.preventDefault(); return didClickDownloadScene(); };
    if (uploadSceneButton) uploadSceneButton.onclick = function(e){ e.preventDefault(); return didClickUploadScene(); };
    if (sceneUploader) sceneUploader.addEventListener('change', handleFileUpload);
    if (downloadLogButton) downloadLogButton.onclick = function(e){ e.preventDefault(); return logManager.download(); };
    
    populateInfoModal();
    handleModal();

    var defaultModel = simulations.init();
    simulations.content.didChangeModel = didChangeModel;
    didChangeModel(defaultModel);
    syncSliderHeadToValue();
  }

  window.addEventListener('load', function() {
    var loader = document.getElementById('loader-wrapper');
    if (loader) loader.style.display = 'none';
    var container = document.querySelector(".ThreeBodyProblem-container");
    if (container) container.classList.add('visible');
    attachEvents();
  });

  return {};
})();
