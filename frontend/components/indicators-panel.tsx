"use client";

import type { StockIndicators } from "@/lib/stock-types";
import { TrendingUp, Activity, LineChart, BarChart3 } from "lucide-react";

interface IndicatorsPanelProps {
  indicators: StockIndicators | null;
  isRunning: boolean;
}

function IndicatorCard({
  label,
  value,
  unit,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: typeof TrendingUp;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border/50 bg-secondary/30 p-4">
      <div className={`rounded-lg p-2.5 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-mono text-xl font-semibold text-foreground">
          {value}
          {unit && <span className="ml-1 text-sm text-muted-foreground">{unit}</span>}
        </p>
      </div>
    </div>
  );
}

export function IndicatorsPanel({ indicators, isRunning }: IndicatorsPanelProps) {
  const formatValue = (value: number | undefined, decimals: number = 2) => {
    if (value === undefined || value === null) return "—";
    return value.toFixed(decimals);
  };

  const getRsiColor = (rsi: number | undefined) => {
    if (rsi === undefined) return "text-muted-foreground";
    if (rsi >= 70) return "text-red-400";
    if (rsi <= 30) return "text-green-400";
    return "text-foreground";
  };

  const getMacdColor = (macd: number | undefined) => {
    if (macd === undefined) return "text-muted-foreground";
    if (macd > 0) return "text-green-400";
    if (macd < 0) return "text-red-400";
    return "text-foreground";
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Live Indicators</h2>
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${isRunning ? "animate-pulse bg-green-500" : "bg-muted-foreground"}`}
          />
          <span className="text-sm text-muted-foreground">
            {isRunning ? "Monitoring" : "Stopped"}
          </span>
        </div>
      </div>

      <div className="grid gap-4">
        <IndicatorCard
          label="Close Price"
          value={indicators ? `NT$ ${formatValue(indicators.close)}` : "—"}
          icon={TrendingUp}
          color="bg-blue-500/20 text-blue-400"
        />

        <div className="flex items-center gap-4 rounded-lg border border-border/50 bg-secondary/30 p-4">
          <div className="rounded-lg bg-amber-500/20 p-2.5 text-amber-400">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">RSI (14)</p>
            <p className={`font-mono text-xl font-semibold ${getRsiColor(indicators?.rsi)}`}>
              {formatValue(indicators?.rsi)}
            </p>
          </div>
          {indicators && (
            <div className="text-right">
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  indicators.rsi >= 70
                    ? "bg-red-500/20 text-red-400"
                    : indicators.rsi <= 30
                      ? "bg-green-500/20 text-green-400"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {indicators.rsi >= 70
                  ? "Overbought"
                  : indicators.rsi <= 30
                    ? "Oversold"
                    : "Neutral"}
              </span>
            </div>
          )}
        </div>

        <IndicatorCard
          label="MA20"
          value={indicators ? `NT$ ${formatValue(indicators.ma20)}` : "—"}
          icon={LineChart}
          color="bg-cyan-500/20 text-cyan-400"
        />

        <div className="flex items-center gap-4 rounded-lg border border-border/50 bg-secondary/30 p-4">
          <div className="rounded-lg bg-emerald-500/20 p-2.5 text-emerald-400">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">MACD</p>
            <p className={`font-mono text-xl font-semibold ${getMacdColor(indicators?.macd)}`}>
              {formatValue(indicators?.macd, 3)}
            </p>
          </div>
          {indicators && (
            <div className="text-right">
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  indicators.macd > 0.5
                    ? "bg-green-500/20 text-green-400"
                    : indicators.macd < -0.5
                      ? "bg-red-500/20 text-red-400"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {indicators.macd > 0.5
                  ? "Bullish"
                  : indicators.macd < -0.5
                    ? "Bearish"
                    : "Neutral"}
              </span>
            </div>
          )}
        </div>
      </div>

      {indicators?.timestamp && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Last updated: {new Date(indicators.timestamp).toLocaleTimeString("zh-TW")}
        </p>
      )}
    </div>
  );
}
