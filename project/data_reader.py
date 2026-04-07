import logging
import os
import time
from threading import Thread
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
logger = logging.getLogger(__name__)

_client = None


def get_client():
    global _client
    if _client is None:
        _client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])
    return _client


def _table(symbol: str) -> str:
    crypto = {"BTC", "ETH", "SOL", "BNB", "XRP"}
    base = symbol.split("/")[0].upper()
    return "crypto_price" if base in crypto else "stock_price"


def get_latest(symbol: str) -> dict | None:
    try:
        result = (
            get_client()
            .table(_table(symbol))
            .select("*")
            .eq("symbol", symbol)
            .order("timestamp", desc=True)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]
        return None
    except Exception as e:
        logger.error(f"Supabase read failed for {symbol}: {e}")
        return None


def get_recent(symbol: str, limit: int = 100) -> list[dict]:
    try:
        result = (
            get_client()
            .table(_table(symbol))
            .select("*")
            .eq("symbol", symbol)
            .order("timestamp", desc=True)
            .limit(limit)
            .execute()
        )
        return list(reversed(result.data))
    except Exception as e:
        logger.error(f"Supabase read failed for {symbol}: {e}")
        return []


def poll(symbol: str, interval_sec: int, callback, stop_event=None):
    """每 N 秒抓一次最新資料，有新資料時觸發 callback。"""
    last_ts = None

    def _run():
        nonlocal last_ts
        while stop_event is None or not stop_event.is_set():
            row = get_latest(symbol)
            if row and row["timestamp"] != last_ts:
                last_ts = row["timestamp"]
                callback(row)
            time.sleep(interval_sec)

    t = Thread(target=_run, daemon=True)
    t.start()
    return t
