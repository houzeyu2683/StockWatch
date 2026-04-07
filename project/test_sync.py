from dotenv import load_dotenv
load_dotenv()

# T01: Supabase 讀取
print("=== T01: Supabase 讀取 ===")
import data_reader as realtime
rows = realtime.get_recent("TSLA", limit=30)
print(f"TSLA 最近筆數: {len(rows)}")
latest = realtime.get_latest("TSLA")
print(f"最新一筆: {latest}")

# T02: 指標計算
print("\n=== T02: 指標計算 ===")
import indicators
if len(rows) >= 26:
    ind = indicators.calculate(rows)
    print(f"指標: {ind}")
else:
    print(f"資料不足（{len(rows)} 筆），跳過")

# T03: 風控
print("\n=== T03: 風控 ===")
import risk
if len(rows) >= 26:
    alerts = risk.check(ind, {"rsi_above": 30, "macd_death": True})
    print(f"警報數: {len(alerts)}")
    for a in alerts:
        print(f"  ⚠️ {a.rule} | {a.indicator}={a.value}")
else:
    print("跳過")

# T05: Gemini
print("\n=== T05: Gemini ===")
import llm
answer = llm.interpret("現在 TSLA 的 RSI 是多少？", "AAPL")
print(f"回答: {answer}")
