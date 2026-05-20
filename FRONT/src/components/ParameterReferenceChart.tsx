import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ReferenceArea,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ZAxis,
} from "recharts";
import { formatLabNumber } from "../lib/labValueParse";

interface ParameterReferenceChartProps {
  name: string;
  valueNumeric: number;
  refLow: number;
  refHigh: number;
  unit: string | null;
}

/** Nuage avec zone de référence et point mesuré (axe horizontal = valeur biologique). */
export default function ParameterReferenceChart({
  name,
  valueNumeric,
  refLow,
  refHigh,
  unit,
}: ParameterReferenceChartProps): JSX.Element {
  const padBase = Math.max((refHigh - refLow) * 0.2, Math.abs(valueNumeric) * 0.05, 0.5);
  const domainMin = Math.min(refLow, valueNumeric) - padBase;
  const domainMax = Math.max(refHigh, valueNumeric) + padBase;
  const u = unit ? ` ${unit}` : "";
  const shortName = name.length > 48 ? `${name.slice(0, 46)}…` : name;

  const point = [{ x: valueNumeric, y: 0, label: shortName }];

  return (
    <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
      <p className="text-xs font-medium text-gray-600 mb-2">
        Lecture graphique : zone verte = intervalle de référence ; point rouge = votre mesure.
      </p>
      <div className="h-[100px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[domainMin, domainMax]}
              tickFormatter={(v) => formatLabNumber(v)}
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
              label={{
                value: u.trim() ? `Valeur (${unit})` : "Valeur",
                position: "insideBottom",
                offset: -4,
                fontSize: 10,
                fill: "#6b7280",
              }}
            />
            <YAxis type="number" dataKey="y" hide domain={[-0.5, 0.5]} />
            <ZAxis range={[140, 140]} />
            <ReferenceArea
              x1={refLow}
              x2={refHigh}
              fill="#bbf7d0"
              fillOpacity={0.95}
              stroke="#86efac"
              strokeOpacity={0.6}
              ifOverflow="extendDomain"
            />
            <Scatter
              name="Votre valeur"
              data={point}
              fill="#dc2626"
              shape="circle"
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value: number, key: string) => {
                if (key === "x") {
                  return [`${formatLabNumber(value)}${u}`, "Mesure"];
                }
                return [value, key];
              }}
              labelFormatter={() => shortName}
              contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-gray-600 sm:grid-cols-4">
        <div>
          <dt className="text-gray-500">Réf. bas</dt>
          <dd className="font-medium text-gray-900">
            {formatLabNumber(refLow)}
            {u}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Réf. haut</dt>
          <dd className="font-medium text-gray-900">
            {formatLabNumber(refHigh)}
            {u}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Mesure</dt>
          <dd className="font-medium text-red-700">
            {formatLabNumber(valueNumeric)}
            {u}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Écart au centre</dt>
          <dd className="font-medium text-gray-900">
            {(() => {
              const mid = (refLow + refHigh) / 2;
              const half = (refHigh - refLow) / 2;
              if (half <= 0) return "—";
              const pct = ((valueNumeric - mid) / half) * 100;
              const sign = pct > 0 ? "+" : "";
              return `${sign}${pct.toFixed(0)} %`;
            })()}
          </dd>
        </div>
      </dl>
    </div>
  );
}
