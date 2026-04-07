export interface StockIndicators {
  close: number;
  rsi: number;
  ma20: number;
  macd: number;
  macd_signal?: number;
  macd_cross?: string | null;
  timestamp?: string;
}

export interface AlertRule {
  rsiOverbought: number;
  rsiOversold: number;
  macdDeath: boolean;
  macdGolden: boolean;
  priceBelowMa: boolean;
}

export interface Alert {
  id: string;
  triggered_at: string;
  ruleName: string;
  value: string | number;
  message: string;
}

export interface StockReport {
  ticker: string;
  generatedAt: string;
  summary: string;
}
