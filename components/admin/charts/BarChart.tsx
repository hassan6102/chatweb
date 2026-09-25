import type { TimeSeriesPoint } from "@/types/admin";

export function BarChart({ data, height = 160, color = "#3854E0" }: { data: TimeSeriesPoint[]; height?: number; color?: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] text-admin-textFaint">{d.value}</span>
            <div
              className="w-full rounded-[3px]"
              style={{ height: `${Math.max((d.value / max) * 100, 3)}%`, backgroundColor: color, opacity: 0.85 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-admin-textFaint">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
