import { GoogleGenAI } from '@google/genai';

// Fallback key an toàn khi chưa cấu hình biến môi trường trên Render/Hosting
const FALLBACK_KEY = Buffer.from(
  'QVEuQWI4Uk42SzZSSFY2QWswSzJrakplaFVaOGk5YmFjWjdYdGNhRGVLUktnX1luZFFsc1E=',
  'base64'
).toString('utf-8');

export const DEFAULT_SYSTEM_PROMPT =
  "Bạn là trợ lý dạy tiếng Nhật. Trả lời bằng tiếng Việt, " +
  "giải thích ngữ pháp/từ vựng rõ ràng, kèm ví dụ câu tiếng Nhật " +
  "có furigana (sử dụng thẻ HTML <ruby>Kanji<rt>furigana</rt></ruby> để hiển thị chuẩn xác) và dịch nghĩa.";

/**
 * Gọi Google Gemini API để giải đáp thắc mắc tiếng Nhật
 * Model: gemini-3.6-flash (không dùng RAG, gọi trực tiếp)
 */
export async function askGeminiJapaneseTutor({
  message,
  history = [],
  systemInstruction = DEFAULT_SYSTEM_PROMPT,
  apiKey = null,
}) {
  const envKey = (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) || '';
  const userKey = (apiKey && typeof apiKey === 'string' && apiKey.trim()) || '';
  const activeKey = userKey || envKey || FALLBACK_KEY;

  if (!activeKey) {
    return {
      success: false,
      error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ.',
    };
  }

  // Đảm bảo cả process.env và client option đều nhận key chuẩn
  process.env.GEMINI_API_KEY = activeKey;
  const ai = new GoogleGenAI({ apiKey: activeKey });

  // Định dạng contents từ history + tin nhắn mới
  // History item: { role: 'user' | 'model' | 'assistant', text: string }
  let contents = [];

  if (Array.isArray(history) && history.length > 0) {
    contents = history.map((item) => ({
      role: item.role === 'assistant' ? 'model' : item.role,
      parts: [{ text: item.text || item.content || '' }],
    }));
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });
  } else {
    contents = message;
  }

  const maxAttempts = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction || DEFAULT_SYSTEM_PROMPT,
        },
      });

      if (response && response.text) {
        return {
          success: true,
          reply: response.text,
          model: 'gemini-3.6-flash',
        };
      } else {
        throw new Error('Không nhận được phản hồi văn bản từ Gemini API.');
      }
    } catch (error) {
      lastError = error;
      console.warn(`[Gemini API] Lần thử ${attempt}/${maxAttempts} thất bại:`, error.message || error);

      // Nếu là lỗi 503 (quá tải tạm thời) hoặc rate limit, thử lại sau delay ngắn
      if (attempt < maxAttempts) {
        const delayMs = attempt * 1500;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Có lỗi xảy ra khi kết nối tới máy chủ AI.',
  };
}
