# -*- coding: utf-8 -*-
"""
Google Gemini AI Japanese Tutor (Standalone Script)
Cài đặt: pip install google-genai
"""

import sys
import os
from google import genai

# Đảm bảo in được tiếng Việt / tiếng Nhật trên Windows Console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ưu tiên lấy từ biến môi trường
api_key = os.environ.get("GEMINI_API_KEY", "")
if not api_key:
    print("Vui lòng thiết lập biến môi trường GEMINI_API_KEY trước khi chạy script.")
    sys.exit(1)
client = genai.Client(api_key=api_key)

system_prompt = (
    "Bạn là trợ lý dạy tiếng Nhật. Trả lời bằng tiếng Việt, "
    "giải thích ngữ pháp/từ vựng rõ ràng, kèm ví dụ câu tiếng Nhật "
    "có furigana và dịch nghĩa."
)

def ask_question(question_text: str):
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=question_text,
        config={"system_instruction": system_prompt}
    )
    return response.text

if __name__ == "__main__":
    if len(sys.argv) > 1:
        question = " ".join(sys.argv[1:])
    else:
        question = "Sự khác nhau giữa て form + いる và て form + ある là gì?"

    print(f"Câu hỏi: {question}\n--- Đang xử lý qua Gemini 3.6 Flash ---\n")
    try:
        answer = ask_question(question)
        print(answer)
    except Exception as e:
        print(f"Lỗi: {e}")
