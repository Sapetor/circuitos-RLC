import React, { useState, useMemo, useEffect } from "react";
import SystemSelector from "./components/SystemSelector";
import { FaBolt, FaWaveSquare, FaBatteryFull, FaUndo, FaDownload, FaCopy, FaSave, FaFolderOpen, FaLightbulb, FaInfoCircle } from 'react-icons/fa';
import ResponsePlot from "./components/ResponsePlot";
import EquationDisplay from "./components/EquationDisplay";
import { getStepResponse } from "./utils/controlMath";

const academicFacts = [
  "El circuito RC es la base de muchos filtros electrónicos.",
  "El factor de amortiguamiento (ζ) determina si la respuesta es oscilatoria.",
  "La constante de tiempo (τ) indica el tiempo necesario para alcanzar el 63% del valor final en un sistema de primer orden.",
  "El circuito RLC puede modelar sistemas mecánicos como masas-resortes-amortiguadores.",
  "El sobreimpulso (overshoot) solo ocurre en sistemas subamortiguados (ζ < 1).",
  "La frecuencia natural (ωₙ) es clave para entender la dinámica de sistemas de segundo orden.",
  "Las condiciones iniciales pueden cambiar radicalmente la respuesta de un sistema.",
  "El análisis de circuitos es fundamental en el diseño de sistemas de control y comunicaciones.",
  "La respuesta escalón es una de las pruebas más usadas en ingeniería de control.",
  "El análisis de sistemas lineales es la base para entender sistemas más complejos."
];

function App() {
  const [systemType, setSystemType] = useState("firstOrder");
  // Circuit/component values
  const [R, setR] = useState(1);
  const [L, setL] = useState(1);
  const [C, setC] = useState(1);
  // Step amplitude
  const [V, setV] = useState(1);
  // Input type
  const [inputType, setInputType] = useState('step');
  // Initial conditions
  const [Vc0, setVc0] = useState(0);
  const [Il0, setIl0] = useState(0);
  // Simulation parameters
  const [tMax, setTMax] = useState(10);
  const [showInfo, setShowInfo] = useState(false);
  const [showEq, setShowEq] = useState(true);
  const [fact, setFact] = useState(null);
  // Impulse amplitude
  const [impulseAmp, setImpulseAmp] = useState(1);
  // Custom input function
  const [customInput, setCustomInput] = useState('sin(2*t)');

  // Map circuit values to simulation parameters
  const parameters = useMemo(() => {
    if (systemType === "firstOrder") {
      return {
        gain: V, // K = V (step amplitude)
        timeConstant: R * C, // tau = RC
        damping: 0.5,
        R, C, L, V, Vc0, Il0,
      };
    } else if (systemType === "rl") {
      return {
        gain: V, // K = V (step amplitude)
        timeConstant: L / R, // tau = L/R
        damping: 0.5,
        R, L, V, Il0,
      };
    } else if (systemType === "rlcSeries") {
      const wn = 1 / Math.sqrt(L * C);
      const zeta = R / 2 * Math.sqrt(C / L);
      return {
        gain: 1,
        timeConstant: 1 / wn,
        damping: zeta,
        wn,
        zeta,
        R, C, L, V, Vc0, Il0,
      };
    } else if (systemType === "rlcParallel") {
      const wn = 1 / Math.sqrt(L * C);
      const zeta = 1 / (2 * R) * Math.sqrt(L / C);
      return {
        gain: 1,
        timeConstant: 1 / wn,
        damping: zeta,
        wn,
        zeta,
        R, C, L, V, Vc0, Il0,
      };
    }
    return { gain: 1, timeConstant: 1, damping: 0.5, R, C, L, V, Vc0, Il0 };
  }, [systemType, R, L, C, V, Vc0, Il0]);

  const data = useMemo(() => getStepResponse(systemType, parameters, tMax, 0.05, inputType, impulseAmp, customInput), [systemType, parameters, tMax, inputType, impulseAmp, customInput]);
  const hasCustomInputError = data && data.error;

  function resetParams() {
    setR(1); setL(1); setC(1); setV(1); setVc0(0); setIl0(0); setTMax(10);
  }

  function downloadPlot() {
    const svg = document.querySelector('.recharts-surface');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'respuesta_circuito.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function copyConfig() {
    const txt = `R = ${R} Ω, L = ${L} H, C = ${C} F, V = ${V} V, Vc(0) = ${Vc0} V, Il(0) = ${Il0} A, tmax = ${tMax} s, tipo = ${systemType}`;
    navigator.clipboard.writeText(txt);
  }

  function saveConfig() {
    localStorage.setItem('sim-circuit-config', JSON.stringify({R, L, C, V, Vc0, Il0, tMax, systemType}));
  }
  function loadConfig() {
    const cfg = localStorage.getItem('sim-circuit-config');
    if (cfg) {
      const {R: r, L: l, C: c, V: v, Vc0: v0, Il0: i, tMax: t, systemType: s} = JSON.parse(cfg);
      setR(r); setL(l); setC(c); setV(v); setVc0(v0); setIl0(i); setTMax(t); setSystemType(s);
    }
  }

  function showRandomFact() {
    setFact(academicFacts[Math.floor(Math.random() * academicFacts.length)]);
    setTimeout(() => setFact(null), 6000);
  }

  // Share current config as URL
  function shareConfig() {
    const config = { R, L, C, V, Vc0, Il0, tMax, systemType, inputType, impulseAmp, customInput };
    const base = window.location.origin + window.location.pathname;
    const url = `${base}?cfg=${encodeURIComponent(JSON.stringify(config))}`;
    navigator.clipboard.writeText(url);
  }

  // On load, check for config in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cfg = params.get('cfg');
    if (cfg) {
      try {
        const obj = JSON.parse(decodeURIComponent(cfg));
        if (obj.R !== undefined) setR(obj.R);
        if (obj.L !== undefined) setL(obj.L);
        if (obj.C !== undefined) setC(obj.C);
        if (obj.V !== undefined) setV(obj.V);
        if (obj.Vc0 !== undefined) setVc0(obj.Vc0);
        if (obj.Il0 !== undefined) setIl0(obj.Il0);
        if (obj.tMax !== undefined) setTMax(obj.tMax);
        if (obj.systemType) setSystemType(obj.systemType);
        if (obj.inputType) setInputType(obj.inputType);
        if (obj.impulseAmp !== undefined) setImpulseAmp(obj.impulseAmp);
        if (obj.customInput !== undefined) setCustomInput(obj.customInput);
      } catch {}
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-200 to-slate-300 p-2 sm:p-4" style={{backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(56,189,248,0.15) 0, transparent 70%), radial-gradient(circle at 20% 80%, rgba(16,185,129,0.12) 0, transparent 70%)'}}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center mb-4">
          <div className="w-full h-2 bg-gradient-to-r from-blue-600 via-emerald-400 to-yellow-400 rounded-t mb-2 animate-gradient-x" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-center text-blue-800 mb-1">Simulador de circuitos RLC</h1>
          <h2 className="text-base sm:text-lg text-center text-gray-700 mb-2">Visualiza y analiza la respuesta temporal de circuitos RC y RLC ante una entrada escalón. Herramienta ideal para estudiantes de ingeniería y ciencias.</h2>
          <button className="text-blue-700 underline text-sm mt-1 hover:text-blue-900 transition-colors" onClick={() => setShowInfo(true)}>¿Qué es esto?</button>
        </div>
        <SystemSelector value={systemType} onChange={setSystemType} />
        {/* Responsive grid: controls left, plot+eq right on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 items-start">
          {/* Controls column */}
          <div>
            <div className="p-6 sm:p-6 bg-white/90 rounded-2xl shadow-xl mb-6 border border-blue-200 animate-fade-in flex flex-col gap-4 sm:gap-6 max-w-full overflow-x-auto">
              {/* Presets for RLC systems */}
              {(systemType === 'rlcSeries' || systemType === 'rlcParallel') && (
                <div className="mb-2">
                  <div className="font-semibold text-blue-800 mb-1">Presets</div>
                  <div className="flex gap-2 flex-wrap">
                    <button type="button" className="px-2 py-1 rounded bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200" onClick={() => {
                      // Subamortiguado (zeta < 1)
                      if (systemType === 'rlcSeries') { setR(1); setL(1); setC(1); }
                      else { setR(5); setL(1); setC(1); }
                    }}>Subamortiguado</button>
                    <button type="button" className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200" onClick={() => {
                      // Críticamente amortiguado (zeta = 1)
                      if (systemType === 'rlcSeries') { setR(2); setL(1); setC(1); }
                      else { setR(0.5); setL(1); setC(1); }
                    }}>Críticamente amortiguado</button>
                    <button type="button" className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-200" onClick={() => {
                      // Sobreamortiguado (zeta > 1)
                      if (systemType === 'rlcSeries') { setR(4); setL(1); setC(1); }
                      else { setR(0.2); setL(1); setC(1); }
                    }}>Sobreamortiguado</button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* R */}
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-2 font-medium text-blue-900 cursor-help" title="Resistencia en ohms">
                    <FaBolt className="text-blue-500" /> R (Ω)
                    <span tabIndex="0" aria-label="¿Qué es R?" className="ml-1 text-blue-400 cursor-pointer" title="Resistencia: Oposición al flujo de corriente. Determina la disipación de energía en calor."><FaInfoCircle /></span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="range" min={0.01} max={10} step={0.01} value={R} onChange={e => setR(Number(e.target.value))} className="w-full accent-blue-500" />
                    <input type="number" min={0.01} step={0.01} value={R} onChange={e => setR(Number(e.target.value))} className="border rounded p-1 w-20 bg-blue-50 text-blue-900 border-blue-200" />
                  </div>
                </div>
                {/* L */}
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-2 font-medium text-blue-900 cursor-help" title="Inductancia en henrios">
                    <FaWaveSquare className="text-emerald-500" /> L (H)
                    <span tabIndex="0" aria-label="¿Qué es L?" className="ml-1 text-emerald-400 cursor-pointer" title="Inductancia: Capacidad de almacenar energía en un campo magnético. Se opone a cambios rápidos de corriente."><FaInfoCircle /></span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="range" min={0.01} max={10} step={0.01} value={L} onChange={e => setL(Number(e.target.value))} className="w-full accent-emerald-500" />
                    <input type="number" min={0.01} step={0.01} value={L} onChange={e => setL(Number(e.target.value))} className="border rounded p-1 w-20 bg-emerald-50 text-emerald-900 border-emerald-200" />
                  </div>
                </div>
                {/* C */}
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-2 font-medium text-blue-900 cursor-help" title="Capacitancia en faradios">
                    <FaBatteryFull className="text-yellow-500" /> C (F)
                    <span tabIndex="0" aria-label="¿Qué es C?" className="ml-1 text-yellow-400 cursor-pointer" title="Capacitancia: Capacidad de almacenar energía en un campo eléctrico. Se opone a cambios rápidos de voltaje."><FaInfoCircle /></span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="range" min={0.01} max={10} step={0.01} value={C} onChange={e => setC(Number(e.target.value))} className="w-full accent-yellow-500" />
                    <input type="number" min={0.01} step={0.01} value={C} onChange={e => setC(Number(e.target.value))} className="border rounded p-1 w-20 bg-yellow-50 text-yellow-900 border-yellow-200" />
                  </div>
                </div>
                {/* Input type selector */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="inputType" className="flex items-center gap-2 font-medium text-blue-900 cursor-help" title="Tipo de entrada">
                    Tipo de entrada
                  </label>
                  <select id="inputType" aria-label="Tipo de entrada" className="border rounded p-1 w-full bg-blue-50 text-blue-900 border-blue-200" value={inputType} onChange={e => setInputType(e.target.value)}>
                    <option value="step">Escalón</option>
                    <option value="impulse">Impulso</option>
                    <option value="custom">Personalizada</option>
                  </select>
                </div>
                {/* V (step amplitude) */}
                {inputType === 'step' && (
                  <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-2 font-medium text-blue-900 cursor-help" title="Amplitud del escalón (V)">
                      <span className="text-blue-500">V</span> Amplitud del escalón (V)
                      <span tabIndex="0" aria-label="¿Qué es V?" className="ml-1 text-blue-400 cursor-pointer" title="Amplitud del escalón: Valor máximo de la entrada aplicada al sistema."><FaInfoCircle /></span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input id="stepAmp" aria-label="Amplitud del escalón" type="range" min={0.1} max={10} step={0.01} value={V} onChange={e => setV(Number(e.target.value))} className="w-full accent-blue-500" />
                      <input aria-label="Amplitud del escalón (número)" type="number" min={0.1} step={0.01} value={V} onChange={e => setV(Number(e.target.value))} className="border rounded p-1 w-20 bg-blue-50 text-blue-900 border-blue-200" />
                    </div>
                  </div>
                )}
                {/* Impulse amplitude control */}
                {inputType === 'impulse' && (
                  <div className="flex flex-col gap-1">
                    <label htmlFor="impulseAmp" className="flex items-center gap-2 font-medium text-blue-900 cursor-help" title="Amplitud del impulso">
                      <span className="text-blue-500">{systemType === 'rlcParallel' ? 'I' : 'V'}</span> Amplitud del impulso
                    </label>
                    <div className="flex items-center gap-2">
                      <input id="impulseAmp" aria-label="Amplitud del impulso" type="range" min={0.1} max={10} step={0.01} value={impulseAmp} onChange={e => setImpulseAmp(Number(e.target.value))} className="w-full accent-blue-500" />
                      <input aria-label="Amplitud del impulso (número)" type="number" min={0.1} step={0.01} value={impulseAmp} onChange={e => setImpulseAmp(Number(e.target.value))} className="border rounded p-1 w-20 bg-blue-50 text-blue-900 border-blue-200" />
                    </div>
                  </div>
                )}
                {/* Custom input function */}
                {inputType === 'custom' && (
                  <div className="flex flex-col gap-1">
                    <label htmlFor="customInput" className="flex items-center gap-2 font-medium text-blue-900 cursor-help" title="Función personalizada de entrada (en función de t)">
                      Función personalizada (de t)
                    </label>
                    <input id="customInput" aria-label="Función personalizada" type="text" value={customInput} onChange={e => setCustomInput(e.target.value)} placeholder="sin(2*t)" className={`border rounded p-1 w-full bg-blue-50 text-blue-900 border-blue-200 ${hasCustomInputError ? 'border-red-500' : ''}`} />
                    <span className="text-xs text-gray-500">Ejemplo: sin(2*t), t &gt; 2 ? 1 : 0</span>
                    {hasCustomInputError && (
                      <span className="text-xs text-red-600 mt-1">La función personalizada no es válida: {data.error}</span>
                    )}
                  </div>
                )}
                {/* tMax */}
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-2 font-medium text-blue-900 cursor-help" title="Duración de la simulación">
                    <span className="text-blue-500"><FaLightbulb /></span> Rango de tiempo (t<sub>máx</sub>)
                    <span tabIndex="0" aria-label="¿Qué es tmax?" className="ml-1 text-blue-400 cursor-pointer" title="Rango de tiempo: Tiempo total de la simulación."><FaInfoCircle /></span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="range" min={1} max={100} step={0.5} value={tMax} onChange={e => setTMax(Number(e.target.value))} className="w-full accent-blue-400" />
                    <input type="number" min={1} max={100} step={0.5} value={tMax} onChange={e => setTMax(Number(e.target.value))} className="border rounded p-1 w-20 bg-blue-50 text-blue-900 border-blue-200" />
                    <span className="text-blue-900">s</span>
                  </div>
                </div>
              </div>
              {/* Initial Conditions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1">
                  <label className="font-medium text-blue-900 cursor-help" title="Voltaje inicial en el capacitor">Condición inicial V<sub>C</sub>(0) (V):
                    <span tabIndex="0" aria-label="¿Qué es Vc0?" className="ml-1 text-blue-400 cursor-pointer" title="Voltaje inicial: Valor de voltaje en el capacitor al inicio de la simulación."><FaInfoCircle /></span>
                  </label>
                  <input type="number" step={0.01} value={Vc0} onChange={e => setVc0(Number(e.target.value))} className="border rounded p-1 w-full bg-blue-50 text-blue-900 border-blue-200" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-medium text-blue-900 cursor-help" title="Corriente inicial en el inductor">Condición inicial I<sub>L</sub>(0) (A):
                    <span tabIndex="0" aria-label="¿Qué es Il0?" className="ml-1 text-blue-400 cursor-pointer" title="Corriente inicial: Valor de corriente en el inductor al inicio de la simulación."><FaInfoCircle /></span>
                  </label>
                  <input type="number" step={0.01} value={Il0} onChange={e => setIl0(Number(e.target.value))} className="border rounded p-1 w-full bg-blue-50 text-blue-900 border-blue-200" />
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                <button className="flex items-center gap-2 px-3 py-1 rounded bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-all duration-200" onClick={resetParams} title="Restablecer parámetros" aria-label="Restablecer parámetros">
                  <FaUndo /> Restablecer
                </button>
                <button className="flex items-center gap-2 px-3 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 transition-all duration-200" onClick={downloadPlot} title="Descargar imagen SVG" aria-label="Descargar imagen SVG">
                  <FaDownload /> Descargar
                </button>
                <button className="flex items-center gap-2 px-3 py-1 rounded bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-200 transition-all duration-200" onClick={copyConfig} title="Copiar configuración al portapapeles" aria-label="Copiar configuración al portapapeles">
                  <FaCopy /> Copiar
                </button>
                <button className="flex items-center gap-2 px-3 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition-all duration-200" onClick={saveConfig} title="Guardar configuración en el navegador" aria-label="Guardar configuración en el navegador">
                  <FaSave /> Guardar
                </button>
                <button className="flex items-center gap-2 px-3 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition-all duration-200" onClick={loadConfig} title="Cargar configuración guardada" aria-label="Cargar configuración guardada">
                  <FaFolderOpen /> Cargar
                </button>
                <button className="flex items-center gap-2 px-3 py-1 rounded bg-pink-100 text-pink-800 border border-pink-200 hover:bg-pink-200 transition-all duration-200" onClick={showRandomFact} title="Dato académico sorpresa" aria-label="Dato académico sorpresa">
                  <FaLightbulb /> Sorpresa
                </button>
                <button className="flex items-center gap-2 px-3 py-1 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 hover:bg-indigo-200 transition-all duration-200" onClick={shareConfig} title="Compartir configuración por URL" aria-label="Compartir configuración por URL">
                  <FaCopy /> Compartir
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="showEq" checked={showEq} onChange={e => setShowEq(e.target.checked)} />
                <label htmlFor="showEq" className="text-blue-900 cursor-pointer">Ver ecuaciones</label>
              </div>
            </div>
            {/* Move characteristic values panel here */}
            <div className="mt-0 p-2 sm:p-4 bg-white rounded-xl shadow border border-blue-100 animate-fade-in">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Valores característicos
                <span tabIndex="0" aria-label="¿Qué son los valores característicos?" className="ml-1 text-blue-400 cursor-pointer" title="Valores característicos: Parámetros clave que describen el comportamiento dinámico del sistema."><FaInfoCircle /></span>
              </h3>
              <ul className="text-blue-900 grid grid-cols-2 gap-x-8 gap-y-1">
                <li>τ = {parameters.timeConstant.toFixed(3)}
                  <span tabIndex="0" aria-label="¿Qué es tau?" className="ml-1 text-blue-400 cursor-pointer" title="Constante de tiempo (τ): Tiempo necesario para que la respuesta alcance el 63% de su valor final."><FaInfoCircle /></span>
                </li>
                {parameters.zeta !== undefined && <li>ζ = {parameters.damping.toFixed(3)}
                  <span tabIndex="0" aria-label="¿Qué es zeta?" className="ml-1 text-blue-400 cursor-pointer" title="Factor de amortiguamiento (ζ): Indica si la respuesta es oscilatoria o no."><FaInfoCircle /></span>
                </li>}
                {parameters.wn !== undefined && <li>ωₙ = {parameters.wn.toFixed(3)}
                  <span tabIndex="0" aria-label="¿Qué es omega_n?" className="ml-1 text-blue-400 cursor-pointer" title="Frecuencia natural (ωₙ): Frecuencia de oscilación del sistema sin amortiguamiento."><FaInfoCircle /></span>
                </li>}
                <li>R = {R} Ω</li>
                <li>L = {L} H</li>
                <li>C = {C} F</li>
                <li>V = {V} V</li>
                {systemType === 'rl' && <li>I<sub>L</sub>(0) = {Il0} A</li>}
                {systemType === 'firstOrder' && <li>V<sub>C</sub>(0) = {Vc0} V</li>}
                <li>I<sub>L</sub>(0) = {Il0} A</li>
              </ul>
            </div>
          </div>
          {/* Plot + equations column */}
          <div className="flex flex-col gap-4 sm:gap-6">
            {!hasCustomInputError && showEq && <EquationDisplay systemType={systemType} data={data} parameters={parameters} />}
          </div>
        </div>
        <footer className="mt-8 text-center text-blue-800 text-xs sm:text-sm opacity-80 select-none">
          Desarrollado para estudiantes de ingeniería y ciencias. <br />
          Ajusta los parámetros y explora el comportamiento de los circuitos dinámicos.
        </footer>
        {showInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full border border-blue-200 relative">
              <button className="absolute top-2 right-2 text-blue-700 text-xl" onClick={() => setShowInfo(false)}>&times;</button>
              <h3 className="text-xl font-bold mb-2 text-blue-800">¿Qué es este simulador?</h3>
              <p className="mb-2 text-gray-700">Esta herramienta permite simular la respuesta temporal de circuitos RC y RLC ante una entrada escalón. Es ideal para visualizar conceptos de teoría de control, análisis de sistemas y electrónica básica.</p>
              <ul className="list-disc pl-5 text-gray-700 mb-2">
                <li>Modifica los valores de R, L, C y condiciones iniciales para ver cómo afectan la respuesta.</li>
                <li>Observa la gráfica y los parámetros característicos del sistema.</li>
                <li>Descarga la imagen del resultado para tus apuntes o reportes.</li>
              </ul>
              <p className="text-gray-600 text-sm">Sugerencias y mejoras son bienvenidas.</p>
            </div>
          </div>
        )}
        {fact && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-800 text-white px-6 py-3 rounded-xl shadow-lg animate-fade-in z-50">
            <span className="font-semibold">Dato académico:</span> {fact}
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 