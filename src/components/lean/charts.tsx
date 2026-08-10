import { cn } from "@/lib/utils";

function getMax(values: number[][]) {
  return Math.max(...values.flat(), 1);
}

function getPoints(values: number[], width: number, height: number, padding: number, maxValue?: number) {
  const max = maxValue ?? Math.max(...values, 1);
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  return values
    .map((value, index) => {
      const x = padding + (usableWidth / Math.max(values.length - 1, 1)) * index;
      const y = height - padding - (value / max) * usableHeight;
      return `${x},${y}`;
    })
    .join(" ");
}

export function Sparkline({
  values,
  color = "#4F46F5",
  className,
}: {
  values: number[];
  color?: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 120 36" className={cn("h-9 w-full", className)} fill="none">
      <polyline
        points={getPoints(values, 120, 36, 3)}
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MultiSeriesChart({
  series,
  className,
}: {
  series: { color: string; values: number[] }[];
  className?: string;
}) {
  const max = getMax(series.map((item) => item.values));

  return (
    <div className={cn("rounded-[24px] border border-[var(--border-default)] bg-white p-4", className)}>
      <svg viewBox="0 0 760 280" className="h-full w-full" fill="none">
        {[0, 1, 2, 3, 4].map((step) => (
          <line
            key={step}
            x1="42"
            y1={40 + step * 50}
            x2="728"
            y2={40 + step * 50}
            stroke="rgba(228,231,236,0.8)"
            strokeDasharray="4 8"
          />
        ))}
        {series.map((item) => (
          <polyline
            key={item.color}
            points={getPoints(item.values, 760, 280, 42, max)}
            stroke={item.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </div>
  );
}

export function ComparisonChart({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const points = getPoints(values, 620, 230, 24, 100);
  const last = points.split(" ").at(-1)?.split(",").map(Number);

  return (
    <div className={cn("rounded-[24px] border border-[var(--border-default)] bg-white p-4", className)}>
      <svg viewBox="0 0 620 230" className="h-full w-full" fill="none">
        {[0, 1, 2, 3].map((step) => (
          <line
            key={step}
            x1="24"
            y1={30 + step * 45}
            x2="596"
            y2={30 + step * 45}
            stroke="rgba(228,231,236,0.8)"
          />
        ))}
        <polyline points={points} stroke="#4F46F5" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((value, index) => {
          const x = 24 + ((620 - 48) / Math.max(values.length - 1, 1)) * index;
          const y = 230 - 24 - (value / 100) * (230 - 48);

          return <circle key={`${value}-${index}`} cx={x} cy={y} r={index === values.length - 1 ? 7 : 5} fill={index === values.length - 1 ? "#fff" : "#4F46F5"} stroke="#4F46F5" strokeWidth={index === values.length - 1 ? "3" : "0"} />;
        })}
        {last ? <circle cx={last[0]} cy={last[1]} r="8" fill="#fff" stroke="#4F46F5" strokeWidth="4" /> : null}
      </svg>
    </div>
  );
}

export function DonutChart({
  segments,
  centerLabel,
  centerValue,
  className,
  size = 180,
}: {
  segments: { value: number; color: string; label?: string }[];
  centerLabel?: string;
  centerValue: string;
  className?: string;
  size?: number;
}) {
  const total = Math.max(
    segments.reduce((sum, segment) => sum + segment.value, 0),
    1,
  );

  const gradient = segments
    .reduce<{ cursor: number; parts: string[] }>(
      (acc, segment) => {
        const start = (acc.cursor / total) * 100;
        acc.cursor += segment.value;
        const end = (acc.cursor / total) * 100;
        acc.parts.push(`${segment.color} ${start}% ${end}%`);
        return acc;
      },
      { cursor: 0, parts: [] },
    )
    .parts.join(", ");

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className="relative grid place-items-center rounded-full"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${gradient})`,
        }}
      >
        <div className="grid h-[70%] w-[70%] place-items-center rounded-full bg-white text-center">
          <div>
            <p className="text-[42px] font-semibold leading-none text-[var(--text-primary)]">{centerValue}</p>
            {centerLabel ? <p className="mt-2 text-[14px] text-[var(--text-secondary)]">{centerLabel}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BarsByDimension({
  items,
  className,
}: {
  items: { label: string; value: number; color?: string }[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-5", className)}>
      {items.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between text-[14px]">
            <span className="text-[var(--text-primary)]">{item.label}</span>
            <span className="font-medium text-[var(--text-primary)]">{item.value}/100</span>
          </div>
          <div className="h-3 rounded-full bg-[var(--surface-subtle)]">
            <div
              className="h-full rounded-full"
              style={{ width: `${item.value}%`, background: item.color ?? "var(--success)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MiniBarChart({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const max = Math.max(...values, 1);

  return (
    <div className={cn("flex h-16 items-end gap-2", className)}>
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className="w-3 rounded-t-full bg-[rgba(79,70,245,0.85)]"
          style={{ height: `${(value / max) * 100}%` }}
        />
      ))}
    </div>
  );
}
