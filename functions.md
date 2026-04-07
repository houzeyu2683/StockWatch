# Worker

post @worker/start/{stock_id}&{sec}
啟動即時擷取服務，每{sec}秒獲取一筆{stock_id}的股票資料
response 會顯示到前端的頁面上呈現，可以檢查是否真的每{sec}擷取一批資料

post @worker/stop/
停止所有{stock_id}的即時擷取服務
response 會顯示到前端的頁面上呈現，可以檢查是否真的停止

get @report/{stock_id}
參考 `project/llm.py`

