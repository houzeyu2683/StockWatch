import asyncio
import logging
import re
from datetime import datetime, timezone

from playwright.async_api import async_playwright

from worker import supabase_writer

logger = logging.getLogger(__name__)

INTERVAL_SEC = 5


def _parse_number(text: str) -> float | None:
    text = text.replace(",", "").strip()
    try:
        return float(text)
    except ValueError:
        return None


async def _fetch_ohlcv(page, symbol: str) -> dict | None:
    try:
        await page.reload(wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        items = await page.locator(
            "#qsp-overview-realtime-info li.price-detail-item"
        ).all()

        data = {}
        for item in items:
            spans = await item.locator("span").all()
            if len(spans) >= 2:
                label = (await spans[0].text_content() or "").strip()
                value = (await spans[1].text_content() or "").strip()
                data[label] = value

        close = _parse_number(data.get("成交", ""))
        open_ = _parse_number(data.get("開盤", ""))
        high = _parse_number(data.get("最高", ""))
        low = _parse_number(data.get("最低", ""))

        volume = _parse_number(data.get("總量", ""))

        if any(v is None for v in [close, open_, high, low, volume]):
            logger.warning(f"{symbol} | 部分欄位缺失: {data}")
            return None

        return {
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            "open": open_,
            "high": high,
            "low": low,
            "close": close,
            "volume": volume,
        }

    except Exception as e:
        logger.warning(f"{symbol} | 抓取失敗: {e}")
        return None


async def run(symbol: str, stop_event=None):
    url = f"https://tw.finance.yahoo.com/quote/{symbol}"
    logger.info(f"TW stock stream started: {symbol}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url, wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        while stop_event is None or not stop_event.is_set():
            ohlcv = await _fetch_ohlcv(page, symbol)
            if ohlcv:
                logger.info(f"{symbol} | close={ohlcv['close']} volume={ohlcv['volume']}")
                supabase_writer.write(symbol, ohlcv, table="stock_price")
            else:
                logger.warning(f"{symbol} | 本次無資料")

            # 等待下一次，每秒檢查一次 stop_event
            for _ in range(INTERVAL_SEC):
                if stop_event and stop_event.is_set():
                    break
                await asyncio.sleep(1)

        await browser.close()
        logger.info(f"TW stock stream stopped: {symbol}")
