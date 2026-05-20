import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  Cell,
} from "recharts";
import type { MedicalResult } from "../types";
import { formatLabNumber } from "../lib/labValueParse";

function barColor(deviationPercent: number): string {
  if (deviationPercent < -60) return "#1d4ed8";
  if (deviationPercent < 0) return "#60a5fa";
  if (deviationPercent === 0) return "#22c55e";
  if (deviationPercent <= 60) return "#fb923c";
  return "#c2410c";
}

interface Row {
  key: string;
  shortName: string;
  ecart: number;
}

function buildRows(results: MedicalResult[]): Row[] {
  const rows: Row[] = [];
  for (const r of results) {
    const d = r.parsed?.deviationPercent;
    if (d == null || !Number.isFinite(d)) continue;
    rows.push({
      key: String(r.id),
      shortName: r.name.length > 32 ? `${r.name.slice(0, 30)}…` : r.name,
      ecart: d,
    });
  }
  return rows;
}

interface ResultsDeviationBarsProps {
  results: MedicalResult[];
}

/** Écarts relatifs au centre de l’intervalle de référence (−100 % bas, +100 % haut). */
export default function ResultsDeviationBars({ results }: ResultsDeviationBarsProps): JSX.Element | null {
  const data = buildRows(results);
  if (data.length < 2) return null;

  const extremum = Math.max(
    110,
    ...data.map((d) => Math.abs(d.ecart)),
  );

  return (
    <div
      className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
      role="img"
      aria-label="Histogramme des écarts au centre de chaque intervalle de référence, en pourcentage."
    >
      <h2 className="text-sm font-semibold text-gray-900 mb-1">
        Écart par rapport au centre de la référence
      </h2>
      <p className="text-xs text-gray-500 mb-3">
        0 % = milieu de l&apos;intervalle ; −100 % et +100 % correspondent aux bornes basse et haute lorsque
        l&apos;intervalle et la mesure sont bien extraits du texte.
      </p>
      <div className="w-full" style={{ height: `${Math.min(420, Math.max(200, data.length * 40))}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              type="number"
              domain={[-extremum, extremum]}
              tickFormatter={(v) => `${formatLabNumber(v)} %`}
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
            />
            <YAxis type="category" dataKey="shortName" width={118} tick={{ fontSize: 11 }} stroke="#6b7280" />
            <ReferenceLine x={0} stroke="#374151" strokeDasharray="4 4" />
            <Tooltip
              formatter={(v: number) => [`${formatLabNumber(v)} %`, "Écart au centre"]}
              labelFormatter={(label) => String(label)}
              contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
            />
            <Bar dataKey="ecart" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {data.map((entry) => (
                <Cell key={entry.key} fill={barColor(entry.ecart)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
