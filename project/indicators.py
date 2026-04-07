import logging
import pandas as pd
import pandas_ta as ta

logger = logging.getLogger(__name__)


def calculate(rows: list[dict], config: dict | None = None) -> dict | None:
    """
    Input:  list of OHLCV dicts（按時間升序）
    Output: dict with indicator values, or None if not enough data
    """
    if len(rows) < 26:
        return None

    df = pd.DataFrame(rows)
    df["close"] = pd.to_numeric(df["close"])
    df["high"] = pd.to_numeric(df["high"])
    df["low"] = pd.to_numeric(df["low"])
    df["volume"] = pd.to_numeric(df["volume"])

    result = {}

    # MA
    ma_period = (config or {}).get("ma_period", 20)
    ma = ta.sma(df["close"], length=ma_period)
    result[f"ma{ma_period}"] = round(float(ma.iloc[-1]), 4) if ma is not None and not ma.empty else None

    # RSI
    rsi = ta.rsi(df["close"], length=14)
    result["rsi"] = round(float(rsi.iloc[-1]), 2) if rsi is not None and not rsi.empty else None

    # MACD
    macd = ta.macd(df["close"])
    if macd is not None and not macd.empty:
        macd_line = macd["MACD_12_26_9"].iloc[-1]
        signal_line = macd["MACDs_12_26_9"].iloc[-1]
        prev_macd = macd["MACD_12_26_9"].iloc[-2]
        prev_signal = macd["MACDs_12_26_9"].iloc[-2]

        result["macd"] = round(float(macd_line), 4)
        result["macd_signal"] = round(float(signal_line), 4)

        if prev_macd <= prev_signal and macd_line > signal_line:
            result["macd_cross"] = "golden"  # 金叉
        elif prev_macd >= prev_signal and macd_line < signal_line:
            result["macd_cross"] = "death"   # 死叉
        else:
            result["macd_cross"] = None

    result["close"] = round(float(df["close"].iloc[-1]), 4)

    return result
