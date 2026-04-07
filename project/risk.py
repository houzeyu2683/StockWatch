from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class Alert:
    indicator: str
    value: float | str
    rule: str
    triggered_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


def check(indicators: dict, rules: dict) -> list[Alert]:
    """
    rules 格式範例：
    {
        "rsi_above": 80,
        "rsi_below": 20,
        "macd_death": True,
        "macd_golden": True,
        "price_below_ma": True,
    }
    """
    alerts = []

    rsi = indicators.get("rsi")
    close = indicators.get("close")
    ma_key = next((k for k in indicators if k.startswith("ma")), None)
    ma = indicators.get(ma_key) if ma_key else None
    macd_cross = indicators.get("macd_cross")

    if rsi is not None and "rsi_above" in rules:
        if rsi > rules["rsi_above"]:
            alerts.append(Alert("RSI", rsi, f"RSI > {rules['rsi_above']}"))

    if rsi is not None and "rsi_below" in rules:
        if rsi < rules["rsi_below"]:
            alerts.append(Alert("RSI", rsi, f"RSI < {rules['rsi_below']}"))

    if close is not None and ma is not None and rules.get("price_below_ma"):
        if close < ma:
            alerts.append(Alert(ma_key, close, f"價格 {close} 跌破 {ma_key} {ma}"))

    if macd_cross == "death" and rules.get("macd_death"):
        alerts.append(Alert("MACD", "death", "MACD 死叉"))

    if macd_cross == "golden" and rules.get("macd_golden"):
        alerts.append(Alert("MACD", "golden", "MACD 金叉"))

    return alerts
