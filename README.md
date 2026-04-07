# StockWatch

<video src="demo.mp4" controls width="100%"></video>

## 專案簡介

StockWatch 是一套台股即時監控系統，整合 Playwright 自動擷取 Yahoo Finance 報價、技術指標計算（RSI、MACD、MA20）、規則式警報，以及 Gemini AI 報告生成。

**核心功能：**
- 即時擷取台股 OHLCV 資料（每 5 秒更新）
- 自動計算 RSI、MACD、MA20 技術指標
- 可自訂警報規則，觸發條件包含 RSI 超買/超賣、MACD 金叉/死叉、價格跌破 MA20
- 一鍵生成 AI 分析報告（Gemini 2.5 Flash）

**技術架構：**
- 前端：Next.js + shadcn/ui
- 後端：FastAPI + Playwright
- 資料庫：Supabase