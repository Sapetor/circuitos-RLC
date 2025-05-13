import { exp, evaluate } from "mathjs";

// Step response for first order: y(t) = Vc0 * exp(-t/tau) + K * (1 - exp(-t/tau))
function firstOrderStep({ gain, timeConstant, Vc0 = 0, Il0 = 0, systemType, R = 1 }, tMax = 10, dt = 0.05) {
  const data = [];
  if (systemType === 'rl') {
    // RL: output is iL(t), initial Il0, tau = L/R, steady = V/R
    for (let t = 0; t <= tMax; t += dt) {
      const y = Il0 * exp(-t / timeConstant) + (gain / R) * (1 - exp(-t / timeConstant));
      data.push({ t: parseFloat(t.toFixed(2)), y });
    }
    return data;
  }
  // RC: output is vC(t), initial Vc0, tau = RC
  for (let t = 0; t <= tMax; t += dt) {
    const y = Vc0 * exp(-t / timeConstant) + gain * (1 - exp(-t / timeConstant));
    data.push({ t: parseFloat(t.toFixed(2)), y });
  }
  return data;
}

// Step response for second order (underdamped) with initial conditions:
// y(t) = steady + A*exp(-zeta*wn*t)*cos(wd*t) + B*exp(-zeta*wn*t)*sin(wd*t)
// For rlcParallel, output is i_L(t) for a step current input
function secondOrderStep({ gain, timeConstant, damping, Vc0 = 0, Il0 = 0, C = 1, wn: wnOverride, zeta: zetaOverride, systemType, V = 1, I = 1 }, tMax = 10, dt = 0.05) {
  const data = [];
  const wn = wnOverride || 1 / timeConstant;
  const zeta = zetaOverride !== undefined ? zetaOverride : damping;
  let y0, dy0, steady;
  if (systemType === "rlcParallel") {
    // Output is i_L(t), step current input of amplitude I
    y0 = Il0; // initial inductor current
    dy0 = 0; // For a step current, initial derivative is 0 (assuming no initial voltage across L)
    steady = I; // Final value is the step current amplitude
  } else {
    // Output is v_C(t), step voltage input of amplitude V
    y0 = Vc0;
    dy0 = Il0 / C;
    steady = V;
  }
  for (let t = 0; t <= tMax; t += dt) {
    let y;
    if (zeta < 1) {
      const wd = wn * Math.sqrt(1 - zeta * zeta);
      const A = y0 - steady;
      const B = (dy0 + zeta * wn * (steady - y0)) / wd;
      y = steady + Math.exp(-zeta * wn * t) * (A * Math.cos(wd * t) + B * Math.sin(wd * t));
    } else if (zeta === 1) {
      const A = y0 - steady;
      const B = dy0 + wn * (steady - y0);
      y = steady + (A + B * t) * Math.exp(-wn * t);
    } else {
      const s1 = -wn * (zeta - Math.sqrt(zeta * zeta - 1));
      const s2 = -wn * (zeta + Math.sqrt(zeta * zeta - 1));
      const denom = s1 - s2;
      const C1 = (dy0 - (y0 - steady) * s2) / denom;
      const C2 = ((y0 - steady) * s1 - dy0) / denom;
      y = steady + C1 * Math.exp(s1 * t) + C2 * Math.exp(s2 * t);
    }
    data.push({ t: parseFloat(t.toFixed(2)), y });
  }
  return data;
}

export function getStepResponse(systemType, parameters, tMax = 10, dt = 0.05, inputType = 'step', impulseAmp = 1, customInput = '') {
  if (inputType === 'custom') {
    try {
      if (systemType === 'firstOrder' || systemType === 'rl') {
        const { timeConstant, Vc0 = 0, Il0 = 0 } = parameters;
        let y = systemType === 'rl' ? Il0 : Vc0;
        const data = [];
        for (let t = 0; t <= tMax; t += dt) {
          const u = evaluate(customInput, { t });
          y += dt * (-y / timeConstant + u / timeConstant);
          data.push({ t: parseFloat(t.toFixed(2)), y });
        }
        return data;
      } else if (systemType === 'rlcSeries' || systemType === 'rlcParallel') {
        const wn = parameters.wn || 1 / parameters.timeConstant;
        const zeta = parameters.zeta !== undefined ? parameters.zeta : parameters.damping;
        let y = systemType === 'rlcParallel' ? parameters.Il0 || 0 : parameters.Vc0 || 0;
        let dy = 0;
        const data = [];
        for (let t = 0; t <= tMax; t += dt) {
          const u = evaluate(customInput, { t });
          const ddy = wn * wn * (u - y) - 2 * zeta * wn * dy;
          dy += dt * ddy;
          y += dt * dy;
          data.push({ t: parseFloat(t.toFixed(2)), y });
        }
        return data;
      }
      return Array.from({ length: Math.ceil(tMax / dt) + 1 }, (_, i) => ({ t: parseFloat((i * dt).toFixed(2)), y: 0 }));
    } catch (e) {
      return { error: e.message };
    }
  }
  if (systemType === "firstOrder" || systemType === "rl") {
    if (inputType === 'impulse') {
      // Impulse response: y(t) = (impulseAmp / tau) * exp(-t/tau)
      const { timeConstant } = parameters;
      const data = [];
      for (let t = 0; t <= tMax; t += dt) {
        const y = (impulseAmp / timeConstant) * exp(-t / timeConstant);
        data.push({ t: parseFloat(t.toFixed(2)), y });
      }
      return data;
    }
    return firstOrderStep({ ...parameters, systemType }, tMax, dt);
  } else if (systemType === "rlcSeries" || systemType === "rlcParallel") {
    if (inputType === 'impulse') {
      // Impulse response for second order: y(t) = impulseAmp * h(t), h(t) is the impulse response
      // For rlcSeries: output is v_C(t), for rlcParallel: output is i_L(t)
      const wn = parameters.wn || 1 / parameters.timeConstant;
      const zeta = parameters.zeta !== undefined ? parameters.zeta : parameters.damping;
      const y0 = 0; // zero initial output
      const dy0 = impulseAmp; // initial derivative = impulse amplitude
      const steady = 0; // zero steady-state for impulse
      const data = [];
      for (let t = 0; t <= tMax; t += dt) {
        let y;
        if (zeta < 1) {
          const wd = wn * Math.sqrt(1 - zeta * zeta);
          const A = y0 - steady;
          const B = (dy0 + zeta * wn * (steady - y0)) / wd;
          y = steady + Math.exp(-zeta * wn * t) * (A * Math.cos(wd * t) + B * Math.sin(wd * t));
        } else if (zeta === 1) {
          const A = y0 - steady;
          const B = dy0 + wn * (steady - y0);
          y = steady + (A + B * t) * Math.exp(-wn * t);
        } else {
          const s1 = -wn * (zeta - Math.sqrt(zeta * zeta - 1));
          const s2 = -wn * (zeta + Math.sqrt(zeta * zeta - 1));
          const denom = s1 - s2;
          const C1 = (dy0 - (y0 - steady) * s2) / denom;
          const C2 = ((y0 - steady) * s1 - dy0) / denom;
          y = steady + C1 * Math.exp(s1 * t) + C2 * Math.exp(s2 * t);
        }
        data.push({ t: parseFloat(t.toFixed(2)), y });
      }
      return data;
    }
    return secondOrderStep({ ...parameters, systemType }, tMax, dt);
  } else {
    return Array.from({ length: Math.ceil(tMax / dt) + 1 }, (_, i) => ({ t: parseFloat((i * dt).toFixed(2)), y: 0 }));
  }
} 