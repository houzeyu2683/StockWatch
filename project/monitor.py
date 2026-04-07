import asyncio
import logging
import threading
from threading import Thread
import data_reader as realtime
import indicators as ind_module
import risk
import mcp_server
from worker import tw_stock_stream
# from worker import stock_stream  # 美股暫時停用
# from worker import websocket_stream  # 加密貨幣暫時停用

logger = logging.getLogger(__name__)

# 共享狀態
state = {
    "symbol": None,
    "indicators": {},
    "alerts": {},
    "running": False,
}

_poll_thread = None
_worker_stop_event = None


def _is_tw_stock(symbol: str) -> bool:
    return symbol.endswith(".TW")


def _on_new_data(symbol: str, row: dict):
    rows = realtime.get_recent(symbol, limit=100)
    ind = ind_module.calculate(rows)
    if ind is None:
        return

    state["indicators"][symbol] = ind
    mcp_server.set_state(state)

    rules = state.get("rules", {})
    new_alerts = risk.check(ind, rules)
    if new_alerts:
        state["alerts"].setdefault(symbol, [])
        state["alerts"][symbol].extend(new_alerts)
        logger.info(f"{symbol} alerts: {[a.rule for a in new_alerts]}")

    logger.info(f"{symbol} | RSI={ind.get('rsi')} | MACD={ind.get('macd_cross')} | close={ind.get('close')}")


def start(symbol: str, rules: dict, interval_sec: int = 10):
    global _poll_thread, _worker_stop_event

    stop()  # 先停掉舊的

    _worker_stop_event = threading.Event()
    state["symbol"] = symbol
    state["rules"] = rules
    state["running"] = True
    state["alerts"].setdefault(symbol, [])

    # 啟動 worker（收資料寫 Supabase）
    if _is_tw_stock(symbol):
        def run_tw():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(tw_stock_stream.run(symbol, _worker_stop_event))

        Thread(target=run_tw, daemon=True).start()
    # else:  # 美股暫時停用
    #     def run_stock():
    #         loop = asyncio.new_event_loop()
    #         asyncio.set_event_loop(loop)
    #         loop.run_until_complete(stock_stream.run(symbol, _worker_stop_event))
    #     Thread(target=run_stock, daemon=True).start()

    # 啟動 monitor（從 Supabase 讀資料算指標）
    _poll_thread = realtime.poll(
        symbol,
        interval_sec,
        lambda row: _on_new_data(symbol, row),
        _worker_stop_event,
    )
    logger.info(f"Monitor started: {symbol}")


def stop():
    global _worker_stop_event
    state["running"] = False
    if _worker_stop_event:
        _worker_stop_event.set()
        _worker_stop_event = None
    logger.info("Monitor stopped")


def get_state() -> dict:
    return state
