import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  RotateCcw,
  Volume2,
  Maximize2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { sendChatMessage, type ChatMessage } from '../../services/aiService';
import { speakText } from '../../lib/speechUtils';

interface FloatingAIChatWidgetProps {
  onOpenFullTab?: () => void;
}

export function FloatingAIChatWidget({ onOpenFullTab }: FloatingAIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Chào bạn! Hãy hỏi tôi bất kỳ câu ngữ pháp hay từ vựng tiếng Nhật nào nhé! (Gemini 3.6 Flash)',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, isLoading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const history = newMessages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const reply = await sendChatMessage({
        message: text,
        history,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: reply,
          timestamp: Date.now(),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Lỗi: ${err.message || 'Không thể kết nối AI.'}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSpeak = (text: string) => {
    const cleanText = text
      .replace(/<rt>.*?<\/rt>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/[*_#`]/g, '');
    speakText(cleanText, 'ja-JP');
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="w-[340px] sm:w-[400px] h-[520px] max-h-[80vh] bg-card border rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-linear-to-r from-indigo-600 to-purple-600 text-white px-3.5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-xs font-bold leading-tight">Gia sư AI Tiếng Nhật</h3>
                <span className="text-[10px] text-white/80">Gemini 3.6 Flash</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {onOpenFullTab && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenFullTab();
                  }}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer text-white/90"
                  title="Mở toàn màn hình"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: 'welcome',
                      role: 'assistant',
                      content:
                        'Chào bạn! Hãy hỏi tôi bất kỳ câu ngữ pháp hay từ vựng tiếng Nhật nào nhé!',
                      timestamp: Date.now(),
                    },
                  ])
                }
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer text-white/90"
                title="Làm mới"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer text-white/90"
                title="Đóng"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-muted/20 text-xs">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`rounded-2xl px-3 py-2 max-w-[85%] leading-relaxed ${
                      isUser
                        ? 'bg-primary text-primary-foreground rounded-tr-xs'
                        : 'bg-card border text-foreground rounded-tl-xs shadow-2xs'
                    }`}
                  >
                    {isUser ? (
                      m.content
                    ) : (
                      <div>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                        >
                          {m.content}
                        </ReactMarkdown>
                        {m.id !== 'welcome' && (
                          <div className="mt-1.5 pt-1 border-t flex justify-end">
                            <button
                              onClick={() => handleSpeak(m.content)}
                              className="text-[10px] text-muted-foreground hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                            >
                              <Volume2 className="w-3 h-3 text-indigo-500" /> Nghe đọc
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs bg-card border rounded-2xl px-3 py-2 w-fit">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span>AI đang suy nghĩ…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-2.5 bg-card border-t flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi từ vựng, ngữ pháp..."
              disabled={isLoading}
              className="flex-1 bg-muted/50 border rounded-xl px-3 py-1.5 text-xs outline-hidden focus:border-indigo-500"
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-8 w-8 p-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-xs shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
      >
        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
        <span>Trợ lý AI</span>
      </button>
    </div>
  );
}
