import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import ResponsePlot from "./ResponsePlot";

const equations = {
  firstOrder: {
    label: "Primer orden (RC)",
    latex: String.raw`v_{out}(t) = V_{C}(0) e^{-t/\tau} + V \left(1 - e^{-t/\tau}\right)`
  },
  rl: {
    label: "Primer orden (RL)",
    latex: String.raw`i_{L}(t) = I_{L}(0) e^{-t/\tau} + \frac{V}{R} \left(1 - e^{-t/\tau}\right)`
  },
  rlcSeries: {
    label: "Segundo orden (RLC Serie)",
    latex: String.raw`v_{out}(t) = V + A e^{-\zeta \omega_n t} \cos(\omega_d t) + B e^{-\zeta \omega_n t} \sin(\omega_d t)`
  },
  rlcParallel: {
    label: "Segundo orden (RLC Paralelo, salida: i_L)",
    latex: String.raw`i_{L}(t) = I + A e^{-\zeta \omega_n t} \cos(\omega_d t) + B e^{-\zeta \omega_n t} \sin(\omega_d t)`
  }
};

const mappingEquations = {
  firstOrder: String.raw`\tau = RC \\ V \text{ (amplitud del escalón)}`,
  rl: String.raw`\tau = \frac{L}{R} \\ \frac{V}{R} \text{ (valor final, amplitud del escalón sobre R)}`,
  rlcSeries: String.raw`A = V_{C}(0) - V \\ B = \frac{\dot{v}_{out}(0) + \zeta \omega_n (V - V_{C}(0))}{\omega_d} \\ \\ \omega_n = \frac{1}{\sqrt{LC}} \qquad \zeta = \frac{R}{2} \sqrt{\frac{C}{L}} \\ \omega_d = \omega_n \sqrt{1-\zeta^2}`,
  rlcParallel: String.raw`A = I_{L}(0) - I \\ B = \frac{\dot{i}_{L}(0) + \zeta \omega_n (I - I_{L}(0))}{\omega_d} \\ \\ \omega_n = \frac{1}{\sqrt{LC}} \qquad \zeta = \frac{1}{2R} \sqrt{\frac{L}{C}} \\ \omega_d = \omega_n \sqrt{1-\zeta^2} \\ I \text{ (amplitud del escalón de corriente)}`
};

const circuitImages = {
  firstOrder: "/first_order_circuit.svg",
  rl: "/rl_circuit.svg",
  rlcSeries: "/rlc_series_circuit.svg",
  rlcParallel: "/rlc_parallel_circuit.svg"
};

const EquationDisplay = ({ systemType, data, parameters }) => {
  const eq = equations[systemType] || equations.firstOrder;
  const html = katex.renderToString(eq.latex, { throwOnError: false, displayMode: true });
  const mapping = mappingEquations[systemType];
  return (
    <div className="p-4 bg-white rounded shadow mb-4 flex flex-col gap-4">
      {/* Plot first */}
      {data && parameters && <ResponsePlot data={data} systemType={systemType} parameters={parameters} />}
      {/* Circuit SVG */}
      <div className="flex justify-center">
        <img src={circuitImages[systemType]} alt={eq.label + ' circuito'} className="max-h-40" />
      </div>
      {/* Equations and mapping */}
      <div>
        <div className="font-medium mb-2 text-gray-900">Ecuación de {eq.label}</div>
        <div dangerouslySetInnerHTML={{ __html: html }} />
        {mapping && (
          <div className="mt-2">
            <span className="font-medium text-gray-900">Relación de parámetros:</span>
            <div dangerouslySetInnerHTML={{ __html: katex.renderToString(mapping, { throwOnError: false, displayMode: true }) }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EquationDisplay; 