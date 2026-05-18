import { useState } from "react";

export default function TestValueCard({ name, onChange }) {
  const safeId = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();

  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const notifyParent = (updated = {}) => {
    onChange?.(name, {
      value: updated.value ?? value,
      unit: updated.unit ?? unit,
      min: updated.min ?? min,
      max: updated.max ?? max,
    });
  };

  const inputClass = `
    border border-gray-200
    rounded-xl
    px-3 py-2
    text-sm
    bg-white
    focus:outline-none
    focus:ring-2
    focus:ring-raspberry-400
    transition
  `;

  return (
    <fieldset
      className="
        bg-white
        rounded-2xl
        border border-gray-100
        p-6
        flex flex-col gap-4
        shadow-sm
      "
      aria-labelledby={`${safeId}-title`}
    >
      <legend
        id={`${safeId}-title`}
        className="text-sm font-semibold text-gray-900"
      >
        {name}
      </legend>

      {/* Valeur + unité */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`${safeId}-value`}
            className="text-sm font-medium text-gray-700"
          >
            Votre valeur
          </label>

          <input
            id={`${safeId}-value`}
            type="number"
            inputMode="decimal"
            step="any"
            placeholder="Exemple : 14,2"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              notifyParent({ value: e.target.value });
            }}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor={`${safeId}-unit`}
            className="text-sm font-medium text-gray-700"
          >
            Unité
          </label>

          <select
            id={`${safeId}-unit`}
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value);
              notifyParent({ unit: e.target.value });
            }}
            className={inputClass}
          >
            <option value="" disabled>
              Sélectionnez une unité
            </option>
            <option value="g/dL">g/dL</option>
            <option value="mg/dL">mg/dL</option>
            <option value="mmol/L">mmol/L</option>
            <option value="µmol/L">µmol/L</option>
            <option value="10^9/L">10⁹/L</option>
            <option value="U/L">U/L</option>
            <option value="%">%</option>
          </select>
        </div>
      </div>

      {/* Plage de référence */}
      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium text-gray-700">
          Plage de référence (optionnel)
        </legend>

        <div className="flex items-center gap-2">
          <input
            id={`${safeId}-min`}
            type="number"
            inputMode="decimal"
            step="any"
            placeholder="Minimum"
            value={min}
            onChange={(e) => {
              setMin(e.target.value);
              notifyParent({ min: e.target.value });
            }}
            className={`w-full ${inputClass}`}
          />

          <span className="text-sm text-gray-400">à</span>

          <input
            id={`${safeId}-max`}
            type="number"
            inputMode="decimal"
            step="any"
            placeholder="Maximum"
            value={max}
            onChange={(e) => {
              setMax(e.target.value);
              notifyParent({ max: e.target.value });
            }}
            className={`w-full ${inputClass}`}
          />
        </div>
      </fieldset>
    </fieldset>
  );
}
