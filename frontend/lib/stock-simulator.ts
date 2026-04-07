import type { StockIndicators, AlertRule, Alert } from "./stock-types";

// Simulated stock data generator for Taiwan stocks
export function generateMockIndicators(
  prevIndicators?: StockIndicators
): StockIndicators {
  const basePrice = prevIndicators?.close || 150 + Math.random() * 50;
  const priceChange = (Math.random() - 0.5) * 4;
  const close = Math.max(10, basePrice + priceChange);

  const baseRsi = prevIndicators?.rsi || 50;
  const rsiChange = (Math.random() - 0.5) * 10;
  const rsi = Math.max(0, Math.min(100, baseRsi + rsiChange));

  const baseMa20 = prevIndicators?.ma20 || close;
  const ma20 = baseMa20 + (close - baseMa20) * 0.1;

  const baseMacd = prevIndicators?.macd || 0;
  const macdChange = (Math.random() - 0.5) * 2;
  const macd = baseMacd + macdChange;

  return {
    close: Number(close.toFixed(2)),
    rsi: Number(rsi.toFixed(2)),
    ma20: Number(ma20.toFixed(2)),
    macd: Number(macd.toFixed(3)),
    timestamp: new Date(),
  };
}

export function checkAlerts(
  indicators: StockIndicators,
  rules: AlertRule
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  // RSI Overbought
  if (indicators.rsi >= rules.rsiOverbought) {
    alerts.push({
      id: `rsi-ob-${now.getTime()}`,
      timestamp: now,
      ruleName: "RSI Overbought",
      value: indicators.rsi,
      message: `RSI (${indicators.rsi}) exceeded overbought threshold (${rules.rsiOverbought})`,
    });
  }

  // RSI Oversold
  if (indicators.rsi <= rules.rsiOversold) {
    alerts.push({
      id: `rsi-os-${now.getTime()}`,
      timestamp: now,
      ruleName: "RSI Oversold",
      value: indicators.rsi,
      message: `RSI (${indicators.rsi}) dropped below oversold threshold (${rules.rsiOversold})`,
    });
  }

  // MACD Threshold (absolute value)
  if (Math.abs(indicators.macd) >= rules.macdThreshold) {
    const direction = indicators.macd > 0 ? "bullish" : "bearish";
    alerts.push({
      id: `macd-${now.getTime()}`,
      timestamp: now,
      ruleName: `MACD ${direction.charAt(0).toUpperCase() + direction.slice(1)}`,
      value: indicators.macd,
      message: `MACD (${indicators.macd}) crossed ${direction} threshold (±${rules.macdThreshold})`,
    });
  }

  // MA20 Threshold (price deviation from MA20 in percentage)
  const ma20Deviation =
    ((indicators.close - indicators.ma20) / indicators.ma20) * 100;
  if (Math.abs(ma20Deviation) >= rules.ma20Threshold) {
    const direction = ma20Deviation > 0 ? "above" : "below";
    alerts.push({
      id: `ma20-${now.getTime()}`,
      timestamp: now,
      ruleName: `Price ${direction.charAt(0).toUpperCase() + direction.slice(1)} MA20`,
      value: Number(ma20Deviation.toFixed(2)),
      message: `Price deviation from MA20 (${ma20Deviation.toFixed(2)}%) exceeded threshold (±${rules.ma20Threshold}%)`,
    });
  }

  return alerts;
}

export function generateReport(
  ticker: string,
  indicators: StockIndicators,
  alerts: Alert[]
): string {
  const now = new Date();
  const recentAlerts = alerts.slice(-10);

  let report = `
════════════════════════════════════════════════════════════
                  TAIWAN STOCK MONITORING REPORT
════════════════════════════════════════════════════════════

Stock Ticker: ${ticker}.TW
Generated At: ${now.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}

────────────────────────────────────────────────────────────
                    CURRENT INDICATORS
────────────────────────────────────────────────────────────

  Close Price    : NT$ ${indicators.close.toFixed(2)}
  RSI (14)       : ${indicators.rsi.toFixed(2)}
  MA20           : NT$ ${indicators.ma20.toFixed(2)}
  MACD           : ${indicators.macd.toFixed(3)}

────────────────────────────────────────────────────────────
                    MARKET ANALYSIS
────────────────────────────────────────────────────────────
`;

  // RSI Analysis
  if (indicators.rsi >= 70) {
    report += `
  RSI Status     : OVERBOUGHT - Consider taking profits`;
  } else if (indicators.rsi <= 30) {
    report += `
  RSI Status     : OVERSOLD - Potential buying opportunity`;
  } else {
    report += `
  RSI Status     : NEUTRAL - No extreme conditions`;
  }

  // Price vs MA20 Analysis
  const deviation =
    ((indicators.close - indicators.ma20) / indicators.ma20) * 100;
  if (deviation > 3) {
    report += `
  MA20 Status    : Price ${deviation.toFixed(2)}% ABOVE MA20 - Bullish trend`;
  } else if (deviation < -3) {
    report += `
  MA20 Status    : Price ${Math.abs(deviation).toFixed(2)}% BELOW MA20 - Bearish trend`;
  } else {
    report += `
  MA20 Status    : Price near MA20 - Consolidation`;
  }

  // MACD Analysis
  if (indicators.macd > 0.5) {
    report += `
  MACD Status    : BULLISH MOMENTUM - Positive divergence`;
  } else if (indicators.macd < -0.5) {
    report += `
  MACD Status    : BEARISH MOMENTUM - Negative divergence`;
  } else {
    report += `
  MACD Status    : NEUTRAL - No strong momentum`;
  }

  report += `

────────────────────────────────────────────────────────────
                    RECENT ALERTS (${recentAlerts.length})
────────────────────────────────────────────────────────────
`;

  if (recentAlerts.length === 0) {
    report += `
  No alerts triggered during monitoring session.
`;
  } else {
    recentAlerts.forEach((alert, index) => {
      report += `
  [${index + 1}] ${alert.timestamp.toLocaleTimeString("zh-TW")} - ${alert.ruleName}
      ${alert.message}
`;
    });
  }

  report += `
════════════════════════════════════════════════════════════
                      END OF REPORT
════════════════════════════════════════════════════════════
`;

  return report;
}
