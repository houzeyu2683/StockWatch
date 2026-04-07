import asyncio
import json
import logging
from datetime import datetime, timezone

import websockets
from worker import supabase_writer

logger = logging.getLogger(__name__)

BINANCE_WS = "wss://stream.binance.com:9443/ws"


def _symbol_to_stream(symbol: str) -> str:
    return symbol.replace("/", "").lower() + "@kline_1m"


async def run(symbol: str, stop_event=None):
    stream = _symbol_to_stream(symbol)
    url = f"{BINANCE_WS}/{stream}"
    logger.info(f"WebSocket started: {symbol} -> {url}")

    while not (stop_event and stop_event.is_set()):
        try:
            async with websockets.connect(url) as ws:
                while not (stop_event and stop_event.is_set()):
                    msg = await ws.recv()
                    data = json.loads(msg)
                    k = data["k"]
                    if not k["x"]:
                        continue
                    ohlcv = {
                        "timestamp": datetime.fromtimestamp(k["t"] / 1000, tz=timezone.utc).isoformat(),
                        "open": float(k["o"]),
                        "high": float(k["h"]),
                        "low": float(k["l"]),
                        "close": float(k["c"]),
                        "volume": float(k["v"]),
                    }
                    logger.info(f"{symbol} | close={ohlcv['close']}")
                    supabase_writer.write(symbol, ohlcv, table="crypto_price")
        except Exception as e:
            if stop_event and stop_event.is_set():
                break
            logger.warning(f"{symbol} disconnected, reconnecting in 5s: {e}")
            await asyncio.sleep(5)