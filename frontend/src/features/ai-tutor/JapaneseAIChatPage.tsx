import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  Bot,
  Send,
  Sparkles,
  RotateCcw,
  Volume2,
  Copy,
  Check,
  Languages,
  BookOpen,
  HelpCircle,
  Lightbulb,
  AlertCircle,
  Loader2,
  Key,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { sendChatMessage, type ChatMessage } from '../../services/aiService';
import { speakText } from '../../lib/speechUtils';

const QUICK_PROMPTS = [
  {
    title: 'Phân biệt 〜ている & 〜てある',
    desc: 'Bản chất ý chí và trạng thái động từ',
    prompt: 'Sự khác nhau giữa て form + いる và て form + ある là gì?',
  },
  {
    title: 'Phân biệt 〜ばよかった & 〜たらよかった',
    desc: 'Ngữ pháp hối tiếc / tiếc nuối',
    prompt: 'Giải thích và so sánh cấu trúc ngữ pháp 〜ばよかった và 〜たらよかった, cho 3 ví dụ kèm furigana.',
  },
  {
    title: 'Phân biệt từ vựng 見る / 観る / 診る',
    desc: 'Hán tự đồng âm khác nghĩa',
    prompt: 'Phân biệt cách dùng của các từ đồng âm 見る, 観る, 診る. Khi nào dùng từ nào kèm câu ví dụ có furigana?',
  },
  {
    title: 'Trợ từ は (wa) vs が (ga)',
    desc: 'Chủ ngữ, chủ đề và tân ngữ',
    prompt: 'Giải thích cách phân biệt trợ từ は và が trong tiếng Nhật cho người mới học dễ nhớ nhất.',
  },
  {
    title: 'Sửa lỗi & Giải thích câu',
    desc: 'Sửa câu giao tiếp tự nhiên',
    prompt: 'Hãy sửa và giải thích câu này cho tự nhiên hơn: 「昨日、私は友達に会いました。とても面白かったです。」',
  },
];

export function JapaneseAIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Xin chào bạn! 👋 Tôi là **Trợ lý AI Nhật ngữ** sử dụng mô hình **Gemini 3.6 Flash**.\n\n' +
        'Tôi có thể giải thích chi tiết ngữ pháp, từ vựng, sửa câu và cung cấp ví dụ có **Furigana** chuẩn xác (chữ phiên âm nhỏ trên đầu chữ Hán).\n\n' +
        'Bạn có thể bấm vào các gợi ý bên dưới hoặc gõ bất kỳ câu hỏi nào về tiếng Nhật nhé!',
      timestamp: Date.now(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [keySaved, setKeySaved] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Chuẩn bị lịch sử hội thoại cho AI
      const history = newMessages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const reply = await sendChatMessage({
        message: text,
        history,
      });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Không thể lấy phản hồi từ AI:** ${err.message || 'Vui lòng thử lại sau giây lát.'}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const handleCopy = (id: string, text: string) => {
    // Lọc bỏ các thẻ HTML để lấy văn bản thuần khi copy nếu muốn, hoặc copy nguyên bản
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string) => {
    // Tách các đoạn tiếng Nhật hoặc đọc toàn bộ câu văn tiếng Nhật
    // Bỏ thẻ HTML như <ruby>, <rt> để đọc âm phát âm
    const cleanText = text
      .replace(/<rt>.*?<\/rt>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/[*_#`]/g, '');
    speakText(cleanText, 'ja-JP');
  };

  const handleResetChat = () => {
    if (window.confirm('Bạn có chắc muốn xóa lịch sử cuộc trò chuyện này?')) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            'Đã làm mới cuộc hội thoại! Bạn hãy đặt câu hỏi ngữ pháp hoặc từ vựng tiếng Nhật mới nhé.',
          timestamp: Date.now(),
        },
      ]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col h-[calc(100vh-65px)]">
      {/* Header card */}
      <div className="bg-card border rounded-2xl p-4 mb-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight">
                Trợ lý AI Nhật ngữ
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <Bot className="w-3 h-3" /> Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Giải thích ngữ pháp, từ vựng chi tiết kèm ví dụ Furigana • Gọi trực tiếp API
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowKeyModal(!showKeyModal)}
            className="h-8 text-xs gap-1.5 rounded-xl cursor-pointer"
            title="Cài đặt API Key cá nhân"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cài đặt Key</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetChat}
            className="h-8 text-xs gap-1.5 rounded-xl cursor-pointer"
            title="Làm mới cuộc trò chuyện"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>
        </div>
      </div>

      {/* API Key Modal / Bar */}
      {showKeyModal && (
        <div className="bg-card border rounded-2xl p-3 sm:p-4 mb-3 shadow-xs animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-foreground">
                Cấu hình Google Gemini API Key
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Mặc định hệ thống đã có key sẵn. Bạn có thể nhập key riêng (được lưu an toàn trên trình duyệt) nếu muốn.
              </p>
            </div>
            {keySaved && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Đã lưu thành công
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Để trống sẽ dùng key mặc định của hệ thống..."
              className="flex-1 bg-muted/50 border rounded-xl px-3 py-1.5 text-xs outline-hidden focus:border-indigo-500"
            />
            <Button
              size="sm"
              onClick={() => {
                if (apiKeyInput.trim()) {
                  localStorage.setItem('gemini_api_key', apiKeyInput.trim());
                } else {
                  localStorage.removeItem('gemini_api_key');
                }
                setKeySaved(true);
                setTimeout(() => {
                  setKeySaved(false);
                  setShowKeyModal(false);
                }, 1200);
              }}
              className="h-8 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Lưu cấu hình
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowKeyModal(false)}
              className="h-8 rounded-xl text-xs cursor-pointer"
            >
              Đóng
            </Button>
          </div>
        </div>
      )}

      {/* Chat Messages Container */}
      <div className="flex-1 bg-card border rounded-2xl p-3 sm:p-5 overflow-y-auto shadow-xs flex flex-col gap-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[90%] sm:max-w-[85%] ${
                isUser ? 'self-end flex-row-reverse' : 'self-start'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex shrink-0 items-center justify-center text-xs font-bold shadow-xs ${
                  isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-linear-to-br from-indigo-500 to-purple-600 text-white'
                }`}
              >
                {isUser ? 'Bạn' : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content */}
              <div
                className={`rounded-2xl px-4 py-3 text-sm shadow-xs ${
                  isUser
                    ? 'bg-primary text-primary-foreground rounded-tr-xs'
                    : 'bg-muted/60 border rounded-tl-xs text-foreground'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-3 rounded-lg border">
                            <table className="min-w-full text-xs sm:text-sm divide-y" {...props} />
                          </div>
                        ),
                        th: ({ node, ...props }) => (
                          <th className="bg-muted px-3 py-2 text-left font-semibold" {...props} />
                        ),
                        td: ({ node, ...props }) => (
                          <td className="px-3 py-2 border-t" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="my-1.5 leading-relaxed" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="my-2 list-disc pl-4 space-y-1" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="my-2 list-decimal pl-4 space-y-1" {...props} />
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>

                    {/* Action buttons on AI message */}
                    {msg.id !== 'welcome' && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer px-1.5 py-0.5 rounded"
                          title="Sao chép câu trả lời"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500">Đã sao chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Sao chép</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleSpeak(msg.content)}
                          className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer px-1.5 py-0.5 rounded"
                          title="Nghe phát âm câu tiếng Nhật"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Phát âm tiếng Nhật</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%] self-start">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 text-white flex shrink-0 items-center justify-center shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-muted/60 border rounded-2xl rounded-tl-xs px-4 py-3 text-sm text-muted-foreground flex items-center gap-2.5 shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span>Gemini 3.6 Flash đang soạn lời giải thích kèm Furigana…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Suggestions */}
      {messages.length <= 2 && (
        <div className="mt-2.5 mb-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold mb-1.5 px-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Gợi ý câu hỏi phổ biến:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.prompt)}
                disabled={isLoading}
                className="text-left p-2.5 rounded-xl border bg-card hover:bg-muted/60 hover:border-indigo-300 transition-all text-xs cursor-pointer shadow-2xs group flex flex-col justify-between"
              >
                <div className="font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {qp.title}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                  {qp.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="mt-3 bg-card border rounded-2xl p-2 sm:p-2.5 shadow-xs flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleTextareaInput}
          onKeyDown={handleKeyDown}
          placeholder="Hỏi về ngữ pháp, từ vựng, ví dụ câu tiếng Nhật… (Nhấn Enter để gửi, Shift+Enter xuống dòng)"
          disabled={isLoading}
          rows={1}
          className="flex-1 bg-transparent border-0 resize-none outline-hidden text-sm px-2.5 py-1.5 max-h-36 placeholder:text-muted-foreground/60 leading-relaxed"
        />

        <Button
          onClick={() => handleSendMessage()}
          disabled={!input.trim() || isLoading}
          size="sm"
          className="rounded-xl px-3.5 h-9 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold cursor-pointer shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
