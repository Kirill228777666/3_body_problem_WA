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
  return { hasClass: hasClass, removeClass: removeClass, addClass: addClass };
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
      masses: [1.98855e30, 5.972e24, 1.898e28],
      densities: [0.001,0.0001,0.0001],
      paleOrbitalPaths: true,
      massSlider: { min: 3e10, max: 3e31, power: 5 },
      timeScaleFactor: 3600*24*30,
      timeScaleFactorSlider: { min: 0, max: 3600*24*365*1500, power: 5 },
      positions: [{r:0,theta:0},{r:7.5e11,theta:-Math.PI/3 - Math.PI/10},{r:7.78e11,theta:0}],
      velocities: [{r:0,theta:Math.PI/2},{r:13.3e3,theta:Math.PI/6 - Math.PI/10},{r:13.1e3,theta:Math.PI/2}]
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

  return { init:init, content:content };
})();

var oddPowerCurve = (function(){
  function calcualteL(d,p){ if(p===0)return 1; return -Math.pow(d,1/p); }
  function calcualteA(d,p){ if(p===0)return 1; return Math.pow(1-d,1/p)-calcualteL(d,p); }
  function sliderInputValue(d,out,p){
    if(p===0) return 1;
    var a = calcualteA(d,p); if(a===0){a=1;}
    var l = calcualteL(d,p);
    var sign = (out-d)<0 ? -1 : 1;
    return (sign*Math.pow(Math.abs(out-d),1/p)-l)/a;
  }
  function sliderOutputValue(d,input,p){
    if(p===0) return 1;
    var a = calcualteA(d,p), l = calcualteL(d,p);
    var res = Math.pow(a*input+l,p)+d;
    if(res<0) res=0;
    return res;
  }
  return { sliderInputValue:sliderInputValue, sliderOutputValue:sliderOutputValue };
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
    
    function update(currentTime) {
        if (currentTime - lastLogTimestamp < logInterval) {
            return;
        }
        lastLogTimestamp = currentTime;

        const allAccs = physics.getAccelerations();
        if (!allAccs || allAccs.length === 0) return;

        var currentLogBlock = `Moment of Time: ${(simulationTime / 1000).toFixed(3)}s\n`;

        for (let bodyIndex = 0; bodyIndex < 3; bodyIndex++) {
            const formulaEl = document.getElementById('formula-text-' + bodyIndex);
            const i = bodyIndex * 4;

            const currentPos = { x: physics.state.u[i], y: physics.state.u[i + 1] };
            const currentVel = { x: physics.state.u[i + 2], y: physics.state.u[i + 3] };
            const currentAcc = allAccs[bodyIndex];

            const formatForUI = (num) => {
                if (num === 0) return "0.00e+0";
                return num.toExponential(2);
            };

            if (formulaEl) {
                formulaEl.innerHTML =
                    `${userInput.bodyNameFromIndex(bodyIndex)}:\n` +
                    `x(Δt) ≈ ${formatForUI(currentPos.x)} + ${formatForUI(currentVel.x)}*Δt + 0.5*(${formatForUI(currentAcc.ax)})*Δt²\n` +
                    `y(Δt) ≈ ${formatForUI(currentPos.y)} + ${formatForUI(currentVel.y)}*Δt + 0.5*(${formatForUI(currentAcc.ay)})*Δt²`;
            }

            currentLogBlock += `\n${userInput.bodyNameFromIndex(bodyIndex)}:\n`;
            currentLogBlock += `  x(Δt) ≈ ${currentPos.x} + ${currentVel.x}*Δt + 0.5*(${currentAcc.ax})*Δt²\n`;
            currentLogBlock += `  y(Δt) ≈ ${currentPos.y} + ${currentVel.y}*Δt + 0.5*(${currentAcc.ay})*Δt²`;
        }

        approximationLog.push(currentLogBlock);
        simulationTime += logInterval;
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

    return {
        clear: clear,
        update: update,
        download: download
    };
})();

var userInput = (function(){
  var sliderLabelElement = document.querySelector(".ThreeBodyProblem-sliderLabel");
  var restartButton = document.querySelector(".ThreeBodyProblem-reload");
  var mass1Button = document.querySelector(".ThreeBodyProblem-mass1Button");
  var mass2Button = document.querySelector(".ThreeBodyProblem-mass2Button");
  var mass3Button = document.querySelector(".ThreeBodyProblem-mass3Button");
  var speedButton = document.querySelector(".ThreeBodyProblem-speedButton");
  var softeningButton = document.querySelector(".ThreeBodyProblem-softeningButton");
  var sliderElement = document.querySelector(".ThreeBodyProblem-slider");
  var sceneContainer = document.querySelector(".ThreeBodyProblem-container");
  var slider, currentSlider="mass", currentMassSliderIndex=0, currentModel;

  var downloadSceneButton = document.getElementById('download-scene-button');
  var uploadSceneButton = document.getElementById('upload-scene-button');
  var sceneUploader = document.getElementById('scene-uploader');
  var downloadLogButton = document.getElementById('download-log-button');
  
  var sliderEditInput = null;

  function ensureSliderEdit() {
    if (sliderEditInput) return;
    sliderEditInput = document.createElement('input');
    sliderEditInput.type = 'text';
    sliderEditInput.className = 'ThreeBodyProblem-sliderEditInput';
    var labelContainer = sliderLabelElement && sliderLabelElement.parentElement ? sliderLabelElement.parentElement : null;
    if (labelContainer) {
        labelContainer.appendChild(sliderEditInput);
    } else {
        document.body.appendChild(sliderEditInput);
    }
    
    sliderEditInput.style.display = 'none';
    sliderEditInput.style.margin = '6px auto 0 auto';
    sliderEditInput.style.padding = '6px 10px';
    sliderEditInput.style.fontSize = '14px';
    sliderEditInput.style.textAlign = 'center';
    sliderEditInput.style.borderRadius = '8px';
    sliderEditInput.style.border = '1px solid rgba(255,255,255,.18)';
    sliderEditInput.style.background = 'rgba(255,255,255,.06)';
    sliderEditInput.style.color = '#f0f0f0';
    sliderEditInput.style.boxShadow = '0 6px 18px rgba(0,0,0,.25)';
    sliderEditInput.style.width = 'calc(100% - 20px)';
    sliderEditInput.style.maxWidth = '520px';
    sliderEditInput.style.boxSizing = 'border-box';
  }

  function showMassEdit() {
    if (currentSlider !== 'mass') return;
    ensureSliderEdit();
    var val = physics.initialConditions.masses[currentMassSliderIndex];
    sliderEditInput.value = String(val);
    sliderLabelElement.style.display = 'none';
    sliderEditInput.style.display = 'block';
    setTimeout(function(){ sliderEditInput.focus(); sliderEditInput.select(); }, 0);
  }

  function finishMassEdit(apply) {
    if (!sliderEditInput) return;
    if (apply) {
      var raw = sliderEditInput.value.trim().replace(',', '.');
      var num = Number(raw);
      if (Number.isFinite(num)) {
        var set = getCurrentSliderSettings();
        if (typeof set.min === 'number') num = Math.max(set.min, num);
        if (typeof set.max === 'number') num = Math.min(set.max, num);
        num = Math.round(num*10000)/10000;
        physics.initialConditions.masses[currentMassSliderIndex] = num;
        graphics.updateObjectSizes(physics.calculateDiameters());
        resetSlider();
      }
    }
    sliderEditInput.style.display = 'none';
    sliderLabelElement.style.display = '';
  }

  function attachSliderEditEvents(){
    ensureSliderEdit();
    if (sliderLabelElement){
      sliderLabelElement.style.cursor = 'pointer';
      sliderLabelElement.addEventListener('click', function(){
        if (currentSlider === 'mass') {
            showMassEdit();
        }
      });
    }
    sliderEditInput.addEventListener('keydown', function(e){
      if (e.key === 'Enter'){ e.preventDefault(); finishMassEdit(true); }
      else if (e.key === 'Escape'){ e.preventDefault(); finishMassEdit(false); }
    });
    sliderEditInput.addEventListener('blur', function(){ finishMassEdit(true); });
  }

  function updateMassButtonsAppearance(useCircles) {
    if (useCircles) {
      cssHelper.addClass(sceneContainer, 'is-circles-mode');
    } else {
      cssHelper.removeClass(sceneContainer, 'is-circles-mode');
    }
    if (window.graphics && typeof graphics.setCircleMode === 'function') {
      graphics.setCircleMode(!!useCircles);
    }
  }

  function getSofteningSliderSettings(isDimensionless){
    return isDimensionless
      ? { min: -3, max: 0, power: 1, defaultLogEpsilon: -1 }
      : { min: 5, max: 8, power: 1, defaultLogEpsilon: Math.log10(Math.sqrt(4.06e13)) };
  }

  function calculateDefaultSliderOutput(sliderSettings){
    var def = getCurrentSimulationValue(currentModel);
    var min = sliderSettings.min, max = sliderSettings.max;
    if (min===undefined || max===undefined || min===max) return 0.5;
    var out = (def - min) / (max - min);
    return Math.max(0, Math.min(1, out));
  }

  function didUpdateSlider(sliderValue){
    var sliderSettings = getCurrentSliderSettings();

    // --- ИЗМЕНЕНИЕ НАЧАЛО: Убрана нелинейная обработка значения слайдера ---
    /*
    if (sliderSettings.power !== undefined && sliderSettings.power !== 1) {
      if (sliderSettings.power % 2 === 1) {
        var defOut = calculateDefaultSliderOutput(sliderSettings);
        sliderValue = oddPowerCurve.sliderOutputValue(defOut, sliderValue, sliderSettings.power);
      } else {
        sliderValue = Math.pow(sliderValue, sliderSettings.power);
      }
      sliderValue = Math.max(0, Math.min(1, sliderValue));
    }
    */
    // --- ИЗМЕНЕНИЕ КОНЕЦ ---

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
    sliderLabelElement.innerText = sliderText;
  }

  function getCurrentSliderSettings(){
    if (currentSlider==="mass") return physics.initialConditions.massSlider;
    if (currentSlider==="speed") return physics.initialConditions.timeScaleFactorSlider;
    if (currentSlider==="softening") return getSofteningSliderSettings(physics.initialConditions.dimensionless);
    return { min:0, max:1 };
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

  function bodyNameFromIndex(i){
    var name = physics.initialConditions.currentPresetName;
    var circles = (name==="FigureEight" || name==="Chaotic");
    if (circles) return ["Тело 1 (красное)","Тело 2 (синее)","Тело 3 (зелёное)"][i] || "Тело";
    return ["Солнце","Земля","Юпитер"][i] || "Тело";
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

  function didClickRestart(){
    logManager.clear();
    
    physics.resetStateToInitialConditions();
    graphics.clearScene(physics.largestDistanceMeters());
    graphics.updateObjectSizes(physics.calculateDiameters());
    if (window.chartManager && typeof window.chartManager.reset === 'function') {
      window.chartManager.reset();
    }
    return false;
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

  function resetSlider(){
    if (typeof sliderEditInput !== 'undefined' && sliderEditInput) {
      sliderEditInput.style.display = 'none';
      if (sliderLabelElement) sliderLabelElement.style.display = '';
    }

    cssHelper.removeClass(sliderElement,"ThreeBodyProblem-sliderSun");
    cssHelper.removeClass(sliderElement,"ThreeBodyProblem-sliderEarth");
    cssHelper.removeClass(sliderElement,"ThreeBodyProblem-sliderJupiter");

    var set = getCurrentSliderSettings();
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
    sliderLabelElement.innerText = txt;

    var pos = (set.min!==undefined && set.max!==undefined && set.min!==set.max) ? (val - set.min)/(set.max - set.min) : 0.5;
    pos = Math.max(0,Math.min(1,pos));

    // --- ИЗМЕНЕНИЕ НАЧАЛО: Убрано нелинейное вычисление позиции слайдера ---
    /*
    if (set.power!==undefined && set.power!==1){
      if (set.power%2===1){
        var defOut = calculateDefaultSliderOutput(set);
        pos = oddPowerCurve.sliderInputValue(defOut, pos, set.power);
      } else {
        pos = Math.pow(pos,1/set.power);
      }
      pos = Math.max(0,Math.min(1,pos));
    }
    */
    // --- ИЗМЕНЕНИЕ КОНЕЦ ---

    if (slider && typeof slider.setNormalizedValue === 'function'){
      slider.setNormalizedValue(pos, true); // silent=true
    }
  }

  function didChangeModel(model){
    currentModel = model;
    physics.changeInitialConditions(currentModel);

    var presetEls = document.querySelectorAll(".ThreeBodyProblem-preset");
    if (model.name === "Custom") {
      for (var i=0; i<presetEls.length; i++) {
        cssHelper.removeClass(presetEls[i],'ThreeBodyProblem-button--isSelected');
      }
    }

    updateMassButtonsAppearance(model.name==="FigureEight" || model.name==="Chaotic");
    didClickRestart();
    resetSlider();
  }

  function didClickMass1(){ currentSlider="mass"; currentMassSliderIndex=0; resetSlider(); return false; }
  function didClickMass2(){ currentSlider="mass"; currentMassSliderIndex=1; resetSlider(); return false; }
  function didClickMass3(){ currentSlider="mass"; currentMassSliderIndex=2; resetSlider(); return false; }
  function didClickSpeed(){ currentSlider="speed"; currentMassSliderIndex=0; resetSlider(); return false; }
  function didClickSoftening(){ currentSlider="softening"; currentMassSliderIndex=0; resetSlider(); return false; }

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
  
  function didClickUploadScene() {
    sceneUploader.click();
    return false;
  }

  function handleFileUpload(event) {
    var file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      alert("Пожалуйста, выберите корректный JSON файл.");
      return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
      var content = e.target.result;
      try {
        var data = JSON.parse(content);
        
        var customPreset = {
          name: "Custom",
          dimensionless: data.dimensionless,
          masses: data.masses,
          positions: data.positions,
          velocities: data.velocities,
          timeScaleFactor: data.timeScaleFactor,
          softeningParameterSquared: data.softeningParameterSquared,
          massSlider: data.dimensionless ? { min: 0.1, max: 10, power: 3 } : { min: 3e10, max: 3e31, power: 5 },
          timeScaleFactorSlider: data.dimensionless ? { min: 0.00, max: 20, power: 1 } : { min: 0, max: 3600*24*365*1000, power: 5 },
          densities: null,
          paleOrbitalPaths: false
        };
        
        didChangeModel(customPreset);
        
        simulation.pause();
        var pauseButton = document.querySelector('.ThreeBodyProblem-pause');
        if (pauseButton) {
          pauseButton.textContent = 'Продолжить';
        }

      } catch (error) {
        alert("Ошибка при загрузке или обработке файла: " + error.message);
      }
    };
    reader.readAsText(file);
    
    event.target.value = '';
  }

  function init(){
    currentModel = simulations.init();
    physics.changeInitialConditions(currentModel);
    simulations.content.didChangeModel = didChangeModel;

    slider = SickSlider(".ThreeBodyProblem-slider");
    slider.onSliderChange = didUpdateSlider;

    resetSlider();
    attachSliderEditEvents();

    if (restartButton) restartButton.onclick = didClickRestart;
    if (mass1Button) mass1Button.onclick = didClickMass1;
    if (mass2Button) mass2Button.onclick = didClickMass2;
    if (mass3Button) mass3Button.onclick = didClickMass3;
    if (speedButton) speedButton.onclick = didClickSpeed;
    if (softeningButton) softeningButton.onclick = didClickSoftening;

    if (downloadSceneButton) downloadSceneButton.onclick = didClickDownloadScene;
    if (uploadSceneButton) uploadSceneButton.onclick = didClickUploadScene;
    if (sceneUploader) sceneUploader.onchange = handleFileUpload;
    if (downloadLogButton) downloadLogButton.onclick = function() { logManager.download(); return false; };

    var pauseButton = document.querySelector('.ThreeBodyProblem-pause');
    if (pauseButton){
      pauseButton.onclick = function(){
        if (simulation.isPaused()){ simulation.resume(); pauseButton.textContent='Пауза'; }
        else { simulation.pause(); pauseButton.textContent='Продолжить'; }
        return false;
      };
    }

    updateMassButtonsAppearance(currentModel.name==="FigureEight" || currentModel.name==="Chaotic");

    var infoButton = document.getElementById('info-button');
    var infoModal = document.getElementById('info-modal');
    var closeModalButton = infoModal.querySelector('.modal-close-button');

    if (infoButton && infoModal && closeModalButton) {
      infoButton.addEventListener('click', function(e) {
        e.preventDefault();
        cssHelper.removeClass(infoModal, 'is-hidden');
      });

      closeModalButton.addEventListener('click', function() {
        cssHelper.addClass(infoModal, 'is-hidden');
      });

      infoModal.addEventListener('click', function(e) {
        if (e.target === infoModal) {
          cssHelper.addClass(infoModal, 'is-hidden');
        }
      });

      window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !cssHelper.hasClass(infoModal, 'is-hidden')) {
          cssHelper.addClass(infoModal, 'is-hidden');
        }
      });
    }
  }

  return { 
    init:init,
    bodyNameFromIndex: bodyNameFromIndex
  };
})();

userInput.init();

window.addEventListener('load', function() {
    var loaderWrapper = document.getElementById('loader-wrapper');
    if(loaderWrapper){
        loaderWrapper.classList.add('hidden');
        setTimeout(function(){
            if(loaderWrapper.parentNode){
                loaderWrapper.parentNode.removeChild(loaderWrapper);
            }
        }, 500);
    }
    
    var container = document.querySelector('.ThreeBodyProblem-container');
    container.classList.add('visible');
    simulation.start();
});
