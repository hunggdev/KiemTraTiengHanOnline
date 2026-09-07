import { askGeminiJapaneseTutor } from '../services/geminiService.js';

/**
 * Xử lý yêu cầu trò chuyện / hỏi đáp AI
 * Route: POST /api/ai/chat
 */
export async function chatWithAI(req, res) {
  try {
    const { message, history, systemInstruction, apiKey } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập nội dung câu hỏi.',
      });
    }

    const result = await askGeminiJapaneseTutor({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
      systemInstruction,
      apiKey,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || 'Lỗi khi tạo phản hồi từ AI.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        reply: result.reply,
        model: result.model,
      },
    });
  } catch (error) {
    console.error('Lỗi controller AI Chat:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi hệ thống máy chủ.',
    });
  }
}
