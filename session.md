# Session — 01 短線監控系統

## 當前 Phase
Phase 5：任務拆解

## JD 摘要
策略交易新創，尋找能以 AI 為核心驅動開發流程的工程師，涵蓋資料擷取、自動化流程、監控告警、風控系統等核心模組。

## 技術切片
- 後台 Thread（算指標 + 風控判斷）
- 技術指標計算（MA / RSI / MACD）
- rule-based 風控（閾值判斷）
- 按需 LLM 解讀（MCP + Claude API）
- Gradio UI

## 選定的 Side Project
短線監控系統：盤中持續監控，觸發警報後用戶點擊才觸發 LLM 解讀，不主動打 API。

## 關鍵決策
- 資料來源由 03/ Worker 統一供應，01 只讀 SQLite
- 警報觸發是 rule-based，No LLM，避免瘋狂下 prompt
- LLM 按需觸發（用戶點「解讀」才打 API）
- 指標計算放在後台 thread，壓力小不需獨立服務
- 前端使用 Gradio

## 上次中斷點
完成 Phase 3（架構設計）、Phase 4（Demo 目標定義），即將進入 Phase 5 任務拆解。

## 備註
- 依賴 03/ Worker 提供資料（SQLite）
- Demo 現場本地跑，K8s 部署透過 GitHub Actions 紀錄展示
