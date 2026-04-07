import asyncio
from playwright.async_api import async_playwright


async def fetch_quote(symbol: str):
    url = f"https://tw.finance.yahoo.com/quote/{symbol}.TW"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        await page.goto(url, wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        # 抓 成交/開盤/最高/最低 from li list
        items = await page.locator(
            '#qsp-overview-realtime-info li.price-detail-item'
        ).all()

        data = {}
        for item in items:
            spans = await item.locator("span").all()
            if len(spans) >= 2:
                label = (await spans[0].text_content() or "").strip()
                value = (await spans[1].text_content() or "").strip()
                data[label] = value

        # 抓成交量
        volume_el = page.locator(
            '#qsp-overview-realtime-info span.Fz\\(16px\\).C\\(\\$c-link-text\\)'
        ).first
        volume = (await volume_el.text_content() or "").strip()
        data["成交量"] = volume

        print(f"Symbol : {symbol}.TW")
        for k, v in data.items():
            print(f"{k:6} : {v}")


if __name__ == "__main__":
    asyncio.run(fetch_quote("2330"))
