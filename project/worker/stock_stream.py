import asyncio
import json
import logging
import os
import time
from datetime import datetime, timezone

import websockets

from worker import supabase_writer

logger = logging.getLogger(__name__)

FINNHUB_WS = "wss://ws.finnhub.io"
INTERVAL_SEC = 60


def _aggregate(trades: list[dict]) -> dict | None:
    if not trades:
        return None
    prices = [t["p"] for t in trades]
    return {
        "timestamp": datetime.fromtimestamp(trades[-1]["t"] / 1000, tz=timezone.utc).isoformat(),
        "open": trades[0]["p"],
        "high": max(prices),
        "low": min(prices),
        "close": trades[-1]["p"],
        "volume": sum(t["v"] for t in trades),
    }


async def run(symbol: str, stop_event=None):
    api_key = os.environ["FINNHUB_API_KEY"]
    url = f"{FINNHUB_WS}?token={api_key}"

    logger.info(f"Stock WebSocket started: {symbol}")
    while not (stop_event and stop_event.is_set()):
        try:
            async with websockets.connect(url) as ws:
                await ws.send(json.dumps({"type": "subscribe", "symbol": symbol}))

                bucket: list[dict] = []
                deadline = time.monotonic() + INTERVAL_SEC

                while not (stop_event and stop_event.is_set()):
                    timeout = max(0.0, deadline - time.monotonic())
                    try:
                        raw = await asyncio.wait_for(ws.recv(), timeout=timeout)
                        msg = json.loads(raw)
                        if msg.get("type") == "trade":
                            for t in msg["data"]:
                                bucket.append({"p": t["p"], "v": t["v"], "t": t["t"]})
                    except asyncio.TimeoutError:
                        ohlcv = _aggregate(bucket)
                        if ohlcv:
                            logger.info(f"{symbol} | close={ohlcv['close']}")
                            supabase_writer.write(symbol, ohlcv, table="stock_price")
                        else:
                            logger.warning(f"{symbol} | no trades this interval")
                        bucket = []
                        deadline = time.monotonic() + INTERVAL_SEC

        except Exception as e:
            if stop_event and stop_event.is_set():
                break
            logger.warning(f"{symbol} disconnected, reconnecting in 5s: {e}")
            await asyncio.sleep(5)
