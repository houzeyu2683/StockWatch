import logging
import os
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


def write(symbol: str, ohlcv: dict, table: str):
    try:
        record = {
            "symbol": symbol,
            "timestamp": ohlcv["timestamp"],
            "open": ohlcv["open"],
            "high": ohlcv["high"],
            "low": ohlcv["low"],
            "close": ohlcv["close"],
            "volume": ohlcv["volume"],
        }
        get_client().table(table).insert(record).execute()
    except Exception as e:
        logger.error(f"Supabase write failed for {symbol}: {e}")
