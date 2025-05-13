import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot, Label } from "recharts";

function getMarkings(systemType, parameters, data) {
  if (systemType === "firstOrder" || systemType === "rl") {
    // Marcar tau (constante de tiempo)
    const tau = parameters.timeConstant;
    const yTau = data.find(d => Math.abs(d.t - tau) < 0.025)?.y;
    return [
      <ReferenceLine key="tau" x={tau} stroke="#f59e42" strokeDasharray="3 3">
        <Label value="τ (constante de tiempo)" position="top" fill="#f59e42" />
      </ReferenceLine>,
      yTau !== undefined && <ReferenceDot key="tau-dot" x={tau} y={yTau} r={5} fill="#f59e42" stroke="none" />
    ];
  } else if (systemType === "rlcSeries" || systemType === "rlcParallel") {
    const wn = 1 / parameters.timeConstant;
    const zeta = parameters.damping;
    const wd = wn * Math.sqrt(Math.max(0, 1 - zeta * zeta));
    let markings = [];
    if (zeta < 1 && wd > 0) {
      // Tiempo al pico
      const tp = Math.PI / wd;
      const yTp = data.find(d => Math.abs(d.t - tp) < 0.025)?.y;
      markings.push(
        <ReferenceLine key="tp" x={tp} stroke="#3b82f6" strokeDasharray="3 3"><Label value="Tiempo al pico" position="top" fill="#3b82f6" /></ReferenceLine>,
        yTp !== undefined && <ReferenceDot key="tp-dot" x={tp} y={yTp} r={5} fill="#3b82f6" stroke="none" />
      );
    }
    return markings;
  }
  return null;
}

const outputLabels = {
  firstOrder: 'Vout(t) (V)',
  rl: 'iL(t) (A)',
  rlcSeries: 'Vout(t) (V)',
  rlcParallel: 'iL(t) (A)',
};

const ResponsePlot = ({ data, systemType, parameters }) => {
  const [visiblePoints, setVisiblePoints] = useState(data.length);

  useEffect(() => {
    setVisiblePoints(0);
    if (!data || !data.length) return;
    let frame = 0;
    const totalFrames = 30;
    const step = Math.ceil(data.length / totalFrames);
    function animate() {
      frame++;
      setVisiblePoints(Math.min(data.length, frame * step));
      if (frame * step < data.length) {
        requestAnimationFrame(animate);
      }
    }
    animate();
    // eslint-disable-next-line
  }, [data]);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold mb-2">Respuesta del sistema</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data.slice(0, visiblePoints)} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="t" label={{ value: 'Tiempo (s)', position: 'insideBottomRight', offset: -5 }} />
          <YAxis label={{ value: outputLabels[systemType], angle: -90, position: 'insideLeft' }} />
          <Tooltip labelFormatter={v => `Tiempo: ${v} s`} formatter={v => [`${v.toFixed(3)}`, outputLabels[systemType]]} />
          <Line type="monotone" dataKey="y" stroke="#2563eb" dot={false} strokeWidth={2} name={outputLabels[systemType]} />
          {getMarkings(systemType, parameters, data)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResponsePlot; 