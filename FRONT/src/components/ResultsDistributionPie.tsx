import type { TooltipProps } from "recharts";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export interface DistributionSlice {
  key: string;
  name: string;
  value: number;
  fill: string;
  /** Détail pour infobulle : « Nom — valeur mesurée » par analyse */
  entries?: string[];
}

interface ResultsDistributionPieProps {
  slices: DistributionSlice[];
  /** Résumé pour lecteurs d'écran */
  ariaSummary: string;
}

function PieSliceTooltip({
  active,
  payload,
}: TooltipProps<number, string>): JSX.Element | null {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as DistributionSlice | undefined;
  if (!row) return null;
  const entries = row.entries ?? [];
  const n = row.value;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md max-w-[min(320px,90vw)]">
      <div className="font-semibold text-gray-900">{row.name}</div>
      <div className="mt-0.5 text-gray-600">
        {n} analyse{n > 1 ? "s" : ""}
      </div>
      {entries.length > 0 ? (
        <ul className="mt-2 space-y-1 border-t border-gray-100 pt-2 text-gray-800">
          {entries.map((line, i) => (
            <li key={`${row.key}-${i}`} className="leading-snug">
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Graphique circulaire : répartition par statut, détail des analyses au survol. */
export default function ResultsDistributionPie({
  slices,
  ariaSummary,
}: ResultsDistributionPieProps): JSX.Element {
  const data = slices.filter((s) => s.value > 0);

  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8" role="status">
        Pas assez de données pour afficher la répartition graphique.
      </p>
    );
  }

  return (
    <div role="img" aria-label={ariaSummary} className="w-full min-h-[260px]">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={88}
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.fill} stroke="#fff" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<PieSliceTooltip />} />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
            formatter={(value) => <span className="text-gray-700">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
