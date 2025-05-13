import React from "react";

const SystemSelector = ({ value, onChange }) => (
  <div className="p-4 bg-white rounded shadow mb-4">
    <label className="block font-medium mb-2">Tipo de sistema</label>
    <select
      className="w-full p-2 border rounded"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      <option value="firstOrder">Primer orden (RC)</option>
      <option value="rl" aria-label="Primer orden RL">Primer orden (RL)</option>
      <option value="rlcSeries">Segundo orden (RLC Serie)</option>
      <option value="rlcParallel">Segundo orden (RLC Paralelo)</option>
    </select>
  </div>
);

export default SystemSelector; 