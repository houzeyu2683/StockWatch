import logging
import os
from dotenv import load_dotenv
import google.generativeai as genai
import data_reader as realtime
import indicators as ind_module
import mcp_server

load_dotenv()
logger = logging.getLogger(__name__)

genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

_tools = [
    genai.protos.Tool(function_declarations=[
        genai.protos.FunctionDeclaration(
            name="get_latest_data",
            description="取得指定標的最新一筆 OHLCV 資料",
            parameters=genai.protos.Schema(
                type=genai.protos.Type.OBJECT,
                properties={"symbol": genai.protos.Schema(type=genai.protos.Type.STRING)},
                required=["symbol"],
            ),
        ),
        genai.protos.FunctionDeclaration(
            name="get_indicators",
            description="取得指定標的當前技術指標數值（MA / RSI / MACD）",
            parameters=genai.protos.Schema(
                type=genai.protos.Type.OBJECT,
                properties={"symbol": genai.protos.Schema(type=genai.protos.Type.STRING)},
                required=["symbol"],
            ),
        ),
        genai.protos.FunctionDeclaration(
            name="get_alerts_history",
            description="取得指定標的最近觸發的警報紀錄",
            parameters=genai.protos.Schema(
                type=genai.protos.Type.OBJECT,
                properties={"symbol": genai.protos.Schema(type=genai.protos.Type.STRING)},
                required=["symbol"],
            ),
        ),
    ])
]

_SYSTEM = """你是一個技術分析助手，根據實際指標數值解讀市場狀況。
回答問題時，必須先呼叫 get_indicators 取得 MA20、RSI、MACD 三個指標，再綜合解讀。
規則：
- 必須透過工具查詢資料，不可憑空回答
- 回答必須包含 MA20、RSI、MACD 的實際數值與解讀
- 不得給出買進 / 賣出建議
- 用繁體中文回答，簡潔清楚，不超過 150 字"""

_TOOL_MAP = {
    "get_latest_data": mcp_server.get_latest_data,
    "get_indicators": mcp_server.get_indicators,
    "get_alerts_history": mcp_server.get_alerts_history,
}


def interpret(question: str, symbol: str) -> str:
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=_SYSTEM,
        tools=_tools,
    )
    chat = model.start_chat()

    prompt = f"標的：{symbol}\n問題：{question}"
    response = chat.send_message(prompt)

    # 處理 function call 迴圈
    for _ in range(5):
        if not response.candidates:
            break
        part = response.candidates[0].content.parts[0]
        if not hasattr(part, "function_call") or not part.function_call.name:
            break

        fn_name = part.function_call.name
        fn_args = dict(part.function_call.args)
        fn_result = _TOOL_MAP[fn_name](**fn_args)

        response = chat.send_message(
            genai.protos.Content(
                parts=[genai.protos.Part(
                    function_response=genai.protos.FunctionResponse(
                        name=fn_name,
                        response={"result": str(fn_result)},
                    )
                )],
                role="user",
            )
        )

    try:
        return response.text
    except Exception:
        return "無法取得回應，請稍後再試。"
