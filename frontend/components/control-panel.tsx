"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { AlertRule } from "@/lib/stock-types";
import { Play, Square, Settings } from "lucide-react";

interface ControlPanelProps {
  ticker: string;
  onTickerChange: (ticker: string) => void;
  rules: AlertRule;
  onRulesChange: (rules: AlertRule) => void;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function ControlPanel({
  ticker,
  onTickerChange,
  rules,
  onRulesChange,
  isRunning,
  onStart,
  onStop,
}: ControlPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          {/* Ticker Input */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="ticker" className="text-sm font-medium text-foreground whitespace-nowrap">
                股票代號
              </label>
              <div className="relative">
                <Input
                  id="ticker"
                  type="text"
                  value={ticker}
                  onChange={(e) => onTickerChange(e.target.value.replace(/\D/g, ""))}
                  placeholder="0050"
                  className="w-28 font-mono text-center bg-secondary/50"
                  disabled={isRunning}
                  maxLength={6}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  .TW
                </span>
              </div>
            </div>
          </div>

          {/* Rule Settings */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Settings className="h-4 w-4" />
            <span className="font-medium">警報規則</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* RSI Overbought */}
            <div className="space-y-1.5">
              <label htmlFor="rsiOverbought" className="text-xs text-muted-foreground">
                RSI 超買
              </label>
              <Input
                id="rsiOverbought"
                type="number"
                value={rules.rsiOverbought}
                onChange={(e) => onRulesChange({ ...rules, rsiOverbought: parseFloat(e.target.value) || 0 })}
                className="font-mono text-sm bg-secondary/50"
                disabled={isRunning}
                min={50}
                max={100}
              />
            </div>

            {/* RSI Oversold */}
            <div className="space-y-1.5">
              <label htmlFor="rsiOversold" className="text-xs text-muted-foreground">
                RSI 超賣
              </label>
              <Input
                id="rsiOversold"
                type="number"
                value={rules.rsiOversold}
                onChange={(e) => onRulesChange({ ...rules, rsiOversold: parseFloat(e.target.value) || 0 })}
                className="font-mono text-sm bg-secondary/50"
                disabled={isRunning}
                min={0}
                max={50}
              />
            </div>

            {/* MACD Death Cross */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">MACD 死叉</label>
              <div className="flex h-9 items-center">
                <Switch
                  checked={rules.macdDeath}
                  onCheckedChange={(v) => onRulesChange({ ...rules, macdDeath: v })}
                  disabled={isRunning}
                />
              </div>
            </div>

            {/* MACD Golden Cross */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">MACD 金叉</label>
              <div className="flex h-9 items-center">
                <Switch
                  checked={rules.macdGolden}
                  onCheckedChange={(v) => onRulesChange({ ...rules, macdGolden: v })}
                  disabled={isRunning}
                />
              </div>
            </div>

            {/* Price Below MA20 */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">價格跌破 MA20</label>
              <div className="flex h-9 items-center">
                <Switch
                  checked={rules.priceBelowMa}
                  onCheckedChange={(v) => onRulesChange({ ...rules, priceBelowMa: v })}
                  disabled={isRunning}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Start/Stop Buttons */}
        <div className="flex items-center gap-3 lg:flex-col lg:justify-center">
          <Button
            onClick={onStart}
            disabled={isRunning || !ticker}
            className="gap-2 bg-green-600 text-white hover:bg-green-700 disabled:bg-green-600/50"
          >
            <Play className="h-4 w-4" />
            開始
          </Button>
          <Button
            onClick={onStop}
            disabled={!isRunning}
            variant="destructive"
            className="gap-2"
          >
            <Square className="h-4 w-4" />
            停止
          </Button>
        </div>
      </div>
    </div>
  );
}
