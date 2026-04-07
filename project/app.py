import logging
import gradio as gr
from dotenv import load_dotenv
import monitor
import llm

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)


def start_monitoring(symbol: str, rsi_above: float, rsi_below: float,
                     macd_death: bool, macd_golden: bool, price_below_ma: bool):
    if not symbol.strip():
        return "請輸入股票代號", "", ""

    rules = {}
    if rsi_above > 0:
        rules["rsi_above"] = rsi_above
    if rsi_below > 0:
        rules["rsi_below"] = rsi_below
    if macd_death:
        rules["macd_death"] = True
    if macd_golden:
        rules["macd_golden"] = True
    if price_below_ma:
        rules["price_below_ma"] = True

    monitor.stop()
    monitor.start(symbol.strip().upper(), rules)
    return f"✅ 已開始監聽 {symbol.strip().upper()}", "", ""


def get_status():
    state = monitor.get_state()
    symbol = state.get("symbol")
    if not symbol:
        return "尚未啟動", "", ""

    ind = state.get("indicators", {}).get(symbol)
    alerts = state.get("alerts", {}).get(symbol, [])

    if ind:
        ind_text = (
            f"close: {ind.get('close')}\n"
            f"RSI: {ind.get('rsi')}\n"
            f"MA20: {ind.get('ma20')}\n"
            f"MACD: {ind.get('macd')} / signal: {ind.get('macd_signal')}\n"
            f"MACD 交叉: {ind.get('macd_cross') or '無'}"
        )
    else:
        ind_text = "等待資料..."

    if alerts:
        alerts_text = "\n".join(
            f"⚠️ [{a.triggered_at[:19]}] {a.rule}" for a in alerts[-5:]
        )
    else:
        alerts_text = "無警報"

    return f"監聽中：{symbol}", ind_text, alerts_text


def interpret_alert(question: str):
    state = monitor.get_state()
    symbol = state.get("symbol")
    if not symbol:
        return "請先啟動監聽"
    if not question.strip():
        return "請輸入問題"
    ind = state.get("indicators", {}).get(symbol)
    if not ind:
        return "⏳ 資料累積中，請稍候（需至少 30 筆資料）"
    return llm.interpret(question.strip(), symbol)


with gr.Blocks(title="短線監控系統") as demo:
    gr.Markdown("# 短線監控系統")

    with gr.Row():
        with gr.Column(scale=1):
            symbol_input = gr.Textbox(label="股票代號", placeholder="如 2330.TW 或 BTC/USDT")
            rsi_above = gr.Slider(0, 100, value=80, label="RSI 超買閾值（0 = 不監控）")
            rsi_below = gr.Slider(0, 100, value=20, label="RSI 超賣閾值（0 = 不監控）")
            macd_death = gr.Checkbox(label="MACD 死叉")
            macd_golden = gr.Checkbox(label="MACD 金叉")
            price_below_ma = gr.Checkbox(label="價格跌破 MA20")
            start_btn = gr.Button("開始監聽", variant="primary")

        with gr.Column(scale=2):
            status_label = gr.Textbox(label="狀態", interactive=False)
            indicators_box = gr.Textbox(label="當前指標", lines=6, interactive=False)
            alerts_box = gr.Textbox(label="警報紀錄", lines=5, interactive=False)
            refresh_btn = gr.Button("刷新")

    gr.Markdown("## AI 解讀")
    question_input = gr.Textbox(label="提問", placeholder="如：RSI 超過 80 代表什麼？")
    interpret_btn = gr.Button("解讀")
    answer_box = gr.Textbox(label="AI 回答", lines=8, interactive=False)

    start_btn.click(
        start_monitoring,
        inputs=[symbol_input, rsi_above, rsi_below, macd_death, macd_golden, price_below_ma],
        outputs=[status_label, indicators_box, alerts_box],
    )

    refresh_btn.click(
        get_status,
        outputs=[status_label, indicators_box, alerts_box],
    )

    interpret_btn.click(
        interpret_alert,
        inputs=[question_input],
        outputs=[answer_box],
    )


if __name__ == "__main__":
    demo.launch()
