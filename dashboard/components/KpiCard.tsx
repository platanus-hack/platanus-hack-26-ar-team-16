import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import clsx from "clsx";

interface Props {
  label: string;
  value: string;
  trend?: number; // percentage
  trendLabel?: string;
  icon?: LucideIcon;
  invertTrend?: boolean; // true if "down is good" (e.g. churn)
  subtitle?: string;
  accent?: "default" | "brand" | "emerald" | "amber" | "indigo";
}

export function KpiCard({
  label,
  value,
  trend,
  trendLabel,
  icon: Icon,
  invertTrend,
  subtitle,
  accent = "default",
}: Props) {
  const positive = trend !== undefined && (invertTrend ? trend < 0 : trend > 0);
  const negative = trend !== undefined && (invertTrend ? trend > 0 : trend < 0);

  const accentBg = {
    default: "bg-ink-100 text-ink-700",
    brand: "bg-brand-100 text-brand-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    indigo: "bg-indigo-100 text-indigo-700",
  }[accent];

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium text-ink-600">{label}</div>
        {Icon && (
          <div className={clsx("w-9 h-9 rounded-lg flex items-center justify-center", accentBg)}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="mt-3 text-2xl lg:text-3xl font-bold text-ink-900 tracking-tight">
        {value}
      </div>
      {(trend !== undefined || subtitle) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {trend !== undefined && (
            <span
              className={clsx(
                "inline-flex items-center gap-1 font-semibold",
                positive && "text-emerald-600",
                negative && "text-rose-600",
                !positive && !negative && "text-ink-500"
              )}
            >
              {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend > 0 ? "+" : ""}
              {trend}%
            </span>
          )}
          {(trendLabel || subtitle) && (
            <span className="text-ink-500">{trendLabel ?? subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}
