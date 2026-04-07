# Tasks — 01 短線監控系統

## Step 0：第三方依賴確認

### T00 — 環境與依賴清單
**目標**：確認所有外部依賴，建立 `.env` 範本與 `requirements.txt`
**需要確認**：
- Supabase URL + API key
- Google API key（Gemini）
- MCP SDK
- 套件：`gradio`, `pandas-ta`, `google-generativeai`, `mcp`, `supabase`
**完成條件**：
- `requirements.txt` 列出所有依賴與版本
- `.env.example` 列出需要填入的環境變數（SUPABASE_URL, SUPABASE_KEY, GOOGLE_API_KEY）
- `pip install -r requirements.txt` 無錯誤

---

## Step 1：模組開發

### T01 — Supabase Realtime 訂閱模組
**目標**：啟動時建立 Supabase Realtime 訂閱，收到新資料時推給後台處理
**Input**：`symbol: str`（要訂閱的標的）
**Output**：每筆新資料觸發 callback，傳入 OHLCV dict
**完成條件**：
- 能成功建立 Supabase Realtime WebSocket 連線
- 03/ Worker 寫入資料時，01/ 能即時收到
- 斷線自動重連
- 單獨測試：手動往 Supabase 插入一筆資料，確認 callback 被觸發
**依賴**：T00、03/ T01 完成（table 存在）

### T02 — 指標計算模組
**目標**：根據收到的 OHLCV 資料，計算 MA / RSI / MACD
**Input**：`list[OHLCV dict]`（滑動視窗，保留最近 N 筆）
**Output**：`dict`（如 `{"rsi": 82.3, "ma20": 850.0, "macd_cross": "death"}`）
**完成條件**：
- 正確計算 MA（週期可設定）、RSI、MACD
- MACD 死叉 / 金叉能正確判斷
- 資料筆數不足時回傳 None，不報錯
- 單獨測試：輸入模擬資料，回傳正確指標數值
**依賴**：T01

### T03 — 風控模組
**目標**：rule-based 閾值判斷，觸發警報
**Input**：`indicators: dict`（來自 T02）, `rules: dict`（用戶設定）
**Output**：`list[Alert]`（含指標名稱、數值、觸發時間）
**完成條件**：
- RSI > 閾值、RSI < 閾值、價格跌破 MA、MACD 死叉 均能正確觸發
- 無觸發時回傳空清單
- 單獨測試：給定指標數值與規則，能正確回傳警報清單
**依賴**：T02

### T04 — MCP Server
**目標**：建立 MCP server，提供 LLM 可呼叫的 tools
**Tools**：
- `get_latest_data(symbol)` — 從 Supabase 讀最新一筆資料
- `get_indicators(symbol)` — 回傳當前指標數值
- `get_alerts_history(symbol)` — 回傳最近警報紀錄
**完成條件**：
- MCP server 能正常啟動
- 每個 tool 單獨測試能回傳正確結果
- Tool schema 定義清楚
**依賴**：T02, T03

### T05 — LLM 解讀模組
**目標**：用戶點擊「解讀」後，觸發 LLM 解讀當前警報
**Input**：`alert: Alert`
**Output**：`str`（LLM 解讀文字，含指標數值依據）
**完成條件**：
- LLM 透過 MCP tool call 主動查詢當前指標
- 回答包含實際數值，不憑空回答
- 不給出買/賣建議（system prompt 設計）
- 單獨測試：輸入警報，能得到有依據的解讀
**依賴**：T04

---

## Step 2：串接

### T06 — 後台監控 Thread
**目標**：背景持續接收 Realtime 推送 → 算指標 → 風控判斷 → 更新警報狀態
**完成條件**：
- 啟動後持續跑，不阻塞 UI
- 有新警報時更新共享狀態，供 UI 讀取
- 可啟動 / 停止
- 本地測試：03/ Worker 寫入資料時，console 印出指標與警報狀態
**依賴**：T01, T02, T03

### T07 — Gradio UI 串接（app.py）
**目標**：將所有模組串接進 Gradio，實現完整使用流程
**完成條件**：
- 用戶可輸入股票代號、勾選指標、設定閾值
- 點「開始監聽」後啟動後台 thread 與 Realtime 訂閱
- 警報觸發時 UI 即時顯示 ⚠️
- 每個警報旁有「解讀」按鈕，點擊後觸發 T05
- 解讀結果顯示在 UI 上
- 切換標的不需重啟
**依賴**：T05, T06

---

## Step 3：部署

### T08 — 容器化
**目標**：建立 Dockerfile
**完成條件**：
- `docker build` 無錯誤
- `docker run` 能正常啟動 Gradio UI
- 環境變數透過 `.env` 注入
**依賴**：T07

### T09 — K8s 部署
**目標**：建立 K8s manifests，獨立部署
**完成條件**：
- Deployment / Service / ConfigMap / Secret 設定完整
- `kubectl apply` 後 Gradio UI 可透過外部 URL 存取
**依賴**：T08

### T10 — CI/CD Pipeline
**目標**：GitHub Actions 自動化測試與部署
**完成條件**：
- Push 到 main 自動觸發
- 跑單元測試（T01~T05）
- 測試通過後自動 build image 並部署到 K8s
**依賴**：T09

---

## 任務狀態

| 任務 | 狀態 |
|---|---|
| T00 環境與依賴清單 | 待開始 |
| T01 Supabase Realtime 訂閱模組 | 待開始 |
| T02 指標計算模組 | 待開始 |
| T03 風控模組 | 待開始 |
| T04 MCP Server | 待開始 |
| T05 LLM 解讀模組 | 待開始 |
| T06 後台監控 Thread | 待開始 |
| T07 Gradio UI 串接 | 待開始 |
| T08 容器化 | 待開始 |
| T09 K8s 部署 | 待開始 |
| T10 CI/CD Pipeline | 待開始 |
