"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { StockIndicators, AlertRule, Alert } from "@/lib/stock-types";
import { startMonitor, stopMonitor, fetchStatus, generateReport } from "@/lib/api";
import { ControlPanel } from "./control-panel";
import { IndicatorsPanel } from "./indicators-panel";
import { AlertsPanel } from "./alerts-panel";
import { ReportPanel } from "./report-panel";
import { Activity } from "lucide-react";

const DEFAULT_RULES: AlertRule = {
  rsiOverbought: 70,
  rsiOversold: 30,
  macdDeath: false,
  macdGolden: false,
  priceBelowMa: false,
};

const POLL_INTERVAL_MS = 5000;

export function StockDashboard() {
  const [ticker, setTicker] = useState("0050");
  const [rules, setRules] = useState<AlertRule>(DEFAULT_RULES);
  const [isRunning, setIsRunning] = useState(false);
  const [indicators, setIndicators] = useState<StockIndicators | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const alertIdsRef = useRef<Set<string>>(new Set());

  const poll = useCallback(async (symbol: string) => {
    try {
      const data = await fetchStatus(symbol);
      if (data.indicators) setIndicators(data.indicators);

      const newAlerts = data.alerts.filter((a) => !alertIdsRef.current.has(a.id));
      if (newAlerts.length > 0) {
        newAlerts.forEach((a) => alertIdsRef.current.add(a.id));
        setAlerts((prev) => [...prev, ...newAlerts].slice(-100));
      }
    } catch {
      // silently ignore poll errors
    }
  }, []);

  const handleStart = useCallback(async () => {
    console.log("handleStart called", ticker, rules);
    if (!ticker) return;
    setError(null);
    try {
      console.log("calling startMonitor...");
      await startMonitor(ticker, rules);
      setIsRunning(true);
      setIndicators(null);
      setAlerts([]);
      setReport(null);
      alertIdsRef.current = new Set();

      intervalRef.current = setInterval(() => poll(ticker), POLL_INTERVAL_MS);
    } catch {
      setError("無法連線到後端，請確認 API server 已啟動");
    }
  }, [ticker, rules, poll]);

  const handleStop = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    try {
      await stopMonitor();
    } finally {
      setIsRunning(false);
    }
  }, []);

  const handleGenerateReport = useCallback(async () => {
    setReportLoading(true);
    setError(null);
    try {
      const text = await generateReport("請根據目前的技術指標（RSI、MACD、MA20、收盤價）生成一份分析報告");
      setReport(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成報告失敗");
    } finally {
      setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/20 p-2">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">台股監控系統</h1>
              <p className="text-sm text-muted-foreground">即時技術指標監控</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <ControlPanel
            ticker={ticker}
            onTickerChange={setTicker}
            rules={rules}
            onRulesChange={setRules}
            isRunning={isRunning}
            onStart={handleStart}
            onStop={handleStop}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <IndicatorsPanel indicators={indicators} isRunning={isRunning} />
            <AlertsPanel alerts={alerts} />
          </div>

          <ReportPanel
            report={report}
            onGenerate={handleGenerateReport}
            isDisabled={!indicators || reportLoading}
            isLoading={reportLoading}
          />
        </div>
      </main>

      <footer className="border-t border-border bg-card/30 mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-muted-foreground">
            台股監控系統 • 資料來源：Yahoo Finance
          </p>
        </div>
      </footer>
    </div>
  );
}
