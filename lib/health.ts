// Helpers for the Apple Health rollups pushed into hae_raw by Health Auto Export.

type HaeMetric = {
  name: string;
  units?: string;
  data?: Array<Record<string, unknown> & { qty?: number; date?: string }>;
};

export type HealthSnapshot = {
  steps: number | null;
  stepsDate: string | null;
  weightKg: number | null;
  sleepHours: number | null;
  restingHr: number | null;
};

/** Reduces recent hae_raw rows (newest first) to the latest value per metric. */
export function summarizeHae(rows: Array<{ data: unknown }>): HealthSnapshot {
  const out: HealthSnapshot = { steps: null, stepsDate: null, weightKg: null, sleepHours: null, restingHr: null };
  for (const row of rows) {
    const metrics = (row.data as { metrics?: HaeMetric[] })?.metrics;
    if (!Array.isArray(metrics)) continue;
    for (const m of metrics) {
      const d = m.data?.[m.data.length - 1];
      if (!d) continue;
      if (m.name === "step_count" && out.steps == null && typeof d.qty === "number") {
        out.steps = Math.round(d.qty);
        out.stepsDate = typeof d.date === "string" ? d.date.slice(0, 10) : null;
      }
      if (m.name === "weight_body_mass" && out.weightKg == null && typeof d.qty === "number") {
        out.weightKg = Math.round(d.qty * 10) / 10;
      }
      if (m.name === "resting_heart_rate" && out.restingHr == null && typeof d.qty === "number") {
        out.restingHr = Math.round(d.qty);
      }
      if (m.name === "sleep_analysis" && out.sleepHours == null) {
        const total =
          (typeof d.rem === "number" ? d.rem : 0) +
          (typeof d.core === "number" ? d.core : 0) +
          (typeof d.deep === "number" ? d.deep : 0) +
          (typeof d.asleep === "number" ? d.asleep : 0);
        if (total > 0) out.sleepHours = Math.round(total * 10) / 10;
      }
    }
    // stop early once everything is filled
    if (out.steps != null && out.weightKg != null && out.sleepHours != null && out.restingHr != null) break;
  }
  return out;
}
