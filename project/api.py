import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import monitor
import llm

logger = logging.getLogger(__name__)

app = FastAPI(title="短線監控系統 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class StartRequest(BaseModel):
    symbol: str
    rules: dict = {}
    interval_sec: int = 60


class InterpretRequest(BaseModel):
    question: str


@app.post("/monitor/start")
def start_monitor(req: StartRequest):
    monitor.stop()
    monitor.start(req.symbol.strip().upper(), req.rules, req.interval_sec)
    return {"status": "ok", "symbol": req.symbol.strip().upper()}


@app.post("/monitor/stop")
def stop_monitor():
    monitor.stop()
    return {"status": "stopped"}


@app.get("/status/{symbol}")
def get_status(symbol: str):
    state = monitor.get_state()
    ind = state.get("indicators", {}).get(symbol.upper())
    alerts = state.get("alerts", {}).get(symbol.upper(), [])
    return {
        "symbol": symbol.upper(),
        "running": state.get("running", False),
        "indicators": ind,
        "alerts": [
            {"indicator": a.indicator, "value": str(a.value), "rule": a.rule, "triggered_at": a.triggered_at}
            for a in alerts[-10:]
        ],
    }


@app.post("/interpret")
def interpret(req: InterpretRequest):
    state = monitor.get_state()
    symbol = state.get("symbol")
    if not symbol:
        return {"error": "請先啟動監聽"}
    ind = state.get("indicators", {}).get(symbol)
    if not ind:
        return {"error": "⏳ 資料累積中，請稍候（需至少 30 筆資料）"}
    answer = llm.interpret(req.question, symbol)
    return {"answer": answer}