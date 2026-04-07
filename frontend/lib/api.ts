import type { AlertRule, StockIndicators, Alert } from "./stock-types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function toBackendRules(rules: AlertRule): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (rules.rsiOverbought > 0) result.rsi_above = rules.rsiOverbought;
  if (rules.rsiOversold > 0) result.rsi_below = rules.rsiOversold;
  if (rules.macdDeath) result.macd_death = true;
  if (rules.macdGolden) result.macd_golden = true;
  if (rules.priceBelowMa) result.price_below_ma = true;
  return result;
}

export async function startMonitor(symbol: string, rules: AlertRule): Promise<void> {
  await fetch(`${API_BASE}/monitor/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      symbol: `${symbol}.TW`,
      rules: toBackendRules(rules),
      interval_sec: 60,
    }),
  });
}

export async function stopMonitor(): Promise<void> {
  await fetch(`${API_BASE}/monitor/stop`, { method: "POST" });
}

export async function fetchStatus(symbol: string): Promise<{
  running: boolean;
  indicators: StockIndicators | null;
  alerts: Alert[];
}> {
  const res = await fetch(`${API_BASE}/status/${symbol}.TW`);
  if (!res.ok) throw new Error("Failed to fetch status");
  const data = await res.json();

  const alerts: Alert[] = (data.alerts ?? []).map(
    (a: { indicator: string; value: string; rule: string; triggered_at: string }, i: number) => ({
      id: `${a.triggered_at}-${i}`,
      triggered_at: a.triggered_at,
      ruleName: a.rule,
      value: a.value,
      message: `${a.indicator}: ${a.value} — ${a.rule}`,
    })
  );

  return {
    running: data.running,
    indicators: data.indicators ?? null,
    alerts,
  };
}

export async function generateReport(question: string): Promise<string> {
  const res = await fetch(`${API_BASE}/interpret`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error("Failed to generate report");
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.answer;
}
