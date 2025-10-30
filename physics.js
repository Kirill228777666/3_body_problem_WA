var physics = (function() {
  var constants = {
    gravitationalConstant: 6.67408 * Math.pow(10, -11),
    averageDensity: 1410
  };

  var state = { u: [0,0,0, 0,  0,0,0, 0,  0,0,0, 0] };
  var initialConditions = { bodies: 3 };

  function calculateRadiusFromMass(mass, density) {
    return Math.pow( (3.0 * mass) / (4.0 * Math.PI * density), 1.0/3.0 );
  }

  function calculateDiameters() {
    var diameters = [];
    for (var iBody = 0; iBody < initialConditions.bodies; iBody++) {
      var density = (initialConditions.densities && initialConditions.densities[iBody]) ?
                    initialConditions.densities[iBody] : constants.averageDensity;
      diameters.push(2 * calculateRadiusFromMass(initialConditions.masses[iBody], density));
    }
    return diameters;
  }

  function calculateCenterOfMassVelocity() {
    var v = {x: 0, y: 0};
    var sumM = 0;
    for (var i = 0; i < initialConditions.bodies; i++) {
      var b = i*4;
      v.x += initialConditions.masses[i] * state.u[b + 2];
      v.y += initialConditions.masses[i] * state.u[b + 3];
      sumM += initialConditions.masses[i];
    }
    v.x /= sumM; v.y /= sumM;
    return v;
  }

  function calculateCenterOfMass() {
    var c = {x: 0, y: 0};
    var sumM = 0;
    for (var i = 0; i < initialConditions.bodies; i++) {
      var b = i*4;
      c.x += initialConditions.masses[i] * state.u[b + 0];
      c.y += initialConditions.masses[i] * state.u[b + 1];
      sumM += initialConditions.masses[i];
    }
    c.x /= sumM; c.y /= sumM;
    return c;
  }

  function resetStateToInitialConditions() {
    if (!initialConditions.positions || !initialConditions.velocities) return;
    var iBody, bodyStart;
    for (iBody = 0; iBody < initialConditions.bodies; iBody++) {
      bodyStart = iBody * 4;
      var position = initialConditions.positions[iBody];
      state.u[bodyStart + 0] = position.r * Math.cos(position.theta);
      state.u[bodyStart + 1] = position.r * Math.sin(position.theta);
      var velocity = initialConditions.velocities[iBody];
      state.u[bodyStart + 2] = velocity.r * Math.cos(velocity.theta);
      state.u[bodyStart + 3] = velocity.r * Math.sin(velocity.theta);
    }
    var vcom = calculateCenterOfMassVelocity();
    var com = calculateCenterOfMass();
    for (iBody = 0; iBody < initialConditions.bodies; iBody++) {
      bodyStart = iBody * 4;
      state.u[bodyStart + 0] -= com.x;
      state.u[bodyStart + 1] -= com.y;
      state.u[bodyStart + 2] -= vcom.x;
      state.u[bodyStart + 3] -= vcom.y;
    }
  }

  function getSofteningSq() {
    if (initialConditions.softeningParameterSquared !== undefined) {
      return initialConditions.softeningParameterSquared;
    }
    return initialConditions.dimensionless ? 0.01 : 4.06e13;
  }

  function accelerationJS(iFromBody, coordinate) {
    var res = 0;
    var iFrom = iFromBody * 4;
    var softeningSq = getSofteningSq();
    var G = (initialConditions.dimensionless !== true) ? constants.gravitationalConstant : 1;
    for (var j = 0; j < initialConditions.bodies; j++) {
      if (j === iFromBody) continue;
      var jFrom = j * 4;
      var dx = state.u[jFrom + 0] - state.u[iFrom + 0];
      var dy = state.u[jFrom + 1] - state.u[iFrom + 1];
      var distSq = dx*dx + dy*dy + softeningSq;
      if (distSq === 0) continue;
      var denom = distSq * Math.sqrt(distSq);
      if (denom === 0) continue;
      res += G * initialConditions.masses[j] *
             (state.u[jFrom + coordinate] - state.u[iFrom + coordinate]) / denom;
    }
    return res;
  }

  function derivativeJS() {
    var du = new Array(initialConditions.bodies * 4);
    for (var i = 0; i < initialConditions.bodies; i++) {
      var b = i*4;
      du[b + 0] = state.u[b + 2];
      du[b + 1] = state.u[b + 3];
      du[b + 2] = accelerationJS(i, 0);
      du[b + 3] = accelerationJS(i, 1);
    }
    return du;
  }

  function getAccelerations() {
    var arr = [];
    for (var i = 0; i < initialConditions.bodies; i++) {
      arr.push({
        ax: accelerationJS(i, 0),
        ay: accelerationJS(i, 1)
      });
    }
    return arr;
  }

  function updatePosition(timestep) {
    if (typeof Module !== 'undefined' && Module && typeof Module.ccall === 'function' && Module.HEAPF64) {
      var bodies = initialConditions.bodies;
      var stateLen = bodies * 4;
      var statePtr = Module._malloc(stateLen * 8);
      var massPtr  = Module._malloc(bodies * 8);

      for (var i = 0; i < stateLen; i++) {
        Module.HEAPF64[(statePtr >> 3) + i] = state.u[i];
      }
      for (var j = 0; j < bodies; j++) {
        Module.HEAPF64[(massPtr >> 3) + j] = initialConditions.masses[j];
      }

      var dimFlag = initialConditions.dimensionless ? 1 : 0;
      var softening = getSofteningSq();

      Module.ccall('integrate', null,
        ['number','number','number','number','number','number'],
        [timestep, statePtr, bodies, massPtr, dimFlag, softening]);

      for (var k = 0; k < stateLen; k++) {
        state.u[k] = Module.HEAPF64[(statePtr >> 3) + k];
      }

      Module._free(statePtr);
      Module._free(massPtr);
      return;
    }

    if (window.rungeKutta && typeof window.rungeKutta.calculate === 'function') {
      window.rungeKutta.calculate(timestep, state.u, derivativeJS);
    }
  }

  function largestDistanceMeters() {
    var result = 0;
    if (!initialConditions.positions) return 0;
    for (var i = 0; i < initialConditions.bodies; i++) {
      var p = initialConditions.positions[i];
      if (result < p.r) result = p.r;
    }
    return result;
  }

  function changeInitialConditions(conditions) {
    initialConditions.dimensionless = conditions.dimensionless;
    initialConditions.masses = conditions.masses.slice();
    initialConditions.positions = conditions.positions;
    initialConditions.velocities = conditions.velocities;
    initialConditions.timeScaleFactor = conditions.timeScaleFactor;
    initialConditions.massSlider = conditions.massSlider;
    initialConditions.timeScaleFactorSlider = conditions.timeScaleFactorSlider;
    initialConditions.densities = conditions.densities;
    initialConditions.paleOrbitalPaths = conditions.paleOrbitalPaths;
    initialConditions.currentPresetName = conditions.name;
    initialConditions.softeningParameterSquared = conditions.softeningParameterSquared;
  }

  function getSpeeds() {
    var speeds = [];
    for (var i = 0; i < initialConditions.bodies; i++) {
      var vx = state.u[i*4 + 2], vy = state.u[i*4 + 3];
      speeds.push(Math.sqrt(vx*vx + vy*vy));
    }
    return speeds;
  }

  function getTotalEnergy() {
    var G = (initialConditions.dimensionless !== true) ? constants.gravitationalConstant : 1;
    var softeningSq = getSofteningSq();
    var K = 0, U = 0;
    for (var i = 0; i < initialConditions.bodies; i++) {
      var vx = state.u[i*4 + 2], vy = state.u[i*4 + 3];
      K += 0.5 * initialConditions.masses[i] * (vx*vx + vy*vy);
    }
    for (var a = 0; a < initialConditions.bodies; a++) {
      for (var b = a + 1; b < initialConditions.bodies; b++) {
        var dx = state.u[b*4]   - state.u[a*4];
        var dy = state.u[b*4+1] - state.u[a*4+1];
        var rSoft = Math.sqrt(dx*dx + dy*dy + softeningSq);
        if (rSoft > 0) {
          U += - G * initialConditions.masses[a] * initialConditions.masses[b] / rSoft;
        }
      }
    }
    return K + U;
  }

  return {
    constants: constants,
    state: state,
    initialConditions: initialConditions,
    calculateRadiusFromMass: calculateRadiusFromMass,
    calculateDiameters: calculateDiameters,
    calculateCenterOfMass: calculateCenterOfMass,
    calculateCenterOfMassVelocity: calculateCenterOfMassVelocity,
    resetStateToInitialConditions: resetStateToInitialConditions,
    updatePosition: updatePosition,
    largestDistanceMeters: largestDistanceMeters,
    changeInitialConditions: changeInitialConditions,
    getSpeeds: getSpeeds,
    getTotalEnergy: getTotalEnergy,
    getAccelerations: getAccelerations
  };
})();