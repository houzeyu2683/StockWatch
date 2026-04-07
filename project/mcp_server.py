from mcp.server.fastmcp import FastMCP
import data_reader as realtime
import indicators as ind_module

mcp = FastMCP("01-monitor")

_state: dict = {}  # 由 monitor.py 注入當前狀態


def set_state(state: dict):
    global _state
    _state = state


@mcp.tool()
def get_latest_data(symbol: str) -> dict:
    """取得指定標的最新一筆 OHLCV 資料"""
    row = realtime.get_latest(symbol)
    if row is None:
        return {"error": f"No data for {symbol}"}
    return row


@mcp.tool()
def get_indicators(symbol: str) -> dict:
    """取得指定標的當前技術指標數值（MA / RSI / MACD）"""
    if symbol in _state.get("indicators", {}):
        return _state["indicators"][symbol]
    rows = realtime.get_recent(symbol, limit=100)
    result = ind_module.calculate(rows)
    return result or {"error": "Not enough data"}


@mcp.tool()
def get_alerts_history(symbol: str) -> list:
    """取得指定標的最近觸發的警報紀錄"""
    alerts = _state.get("alerts", {}).get(symbol, [])
    return [
        {"indicator": a.indicator, "value": str(a.value), "rule": a.rule, "triggered_at": a.triggered_at}
        for a in alerts[-10:]
    ]


if __name__ == "__main__":
    mcp.run()
