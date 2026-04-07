"use client";

import type { Alert } from "@/lib/stock-types";
import { AlertTriangle, Bell } from "lucide-react";
import { useEffect, useRef } from "react";

interface AlertsPanelProps {
  alerts: Alert[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [alerts]);

  const getAlertColor = (ruleName: string) => {
    if (ruleName.includes("Overbought") || ruleName.includes("Bearish")) {
      return "border-red-500/50 bg-red-500/10";
    }
    if (ruleName.includes("Oversold") || ruleName.includes("Bullish")) {
      return "border-green-500/50 bg-green-500/10";
    }
    return "border-amber-500/50 bg-amber-500/10";
  };

  const getAlertIcon = (ruleName: string) => {
    if (ruleName.includes("Overbought") || ruleName.includes("Bearish")) {
      return <AlertTriangle className="h-4 w-4 text-red-400" />;
    }
    if (ruleName.includes("Oversold") || ruleName.includes("Bullish")) {
      return <AlertTriangle className="h-4 w-4 text-green-400" />;
    }
    return <Bell className="h-4 w-4 text-amber-400" />;
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Alert Log</h2>
        <span className="rounded-full bg-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
          {alerts.length} alerts
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto pr-2"
        style={{ maxHeight: "320px" }}
      >
        {alerts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <Bell className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No alerts triggered yet</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Alerts will appear here when rules are triggered
            </p>
          </div>
        ) : (
          [...alerts].reverse().map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg border p-3 transition-all ${getAlertColor(alert.ruleName)}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getAlertIcon(alert.ruleName)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground text-sm truncate">
                      {alert.ruleName}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(alert.triggered_at).toLocaleTimeString("zh-TW")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {alert.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
