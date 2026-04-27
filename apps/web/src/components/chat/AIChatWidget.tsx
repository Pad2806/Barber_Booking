'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, Loader2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

const SUGGESTED_QUESTIONS = [
  { emoji: '✂️', text: 'Xem dịch vụ & giá' },
  { emoji: '🕐', text: 'Giờ mở cửa' },
  { emoji: '📅', text: 'Đặt lịch cắt tóc' },
  { emoji: '📍', text: 'Địa chỉ salon' },
];

const STAFF_PATHS = ['/admin', '/manager', '/cashier', '/barber', '/skinner'];

export function AIChatWidget() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hide on staff pages (by URL) or for staff roles (by session)
  const isStaffPage = STAFF_PATHS.some(p => pathname?.startsWith(p));
  const userRole = (session?.user as any)?.role;
  const STAFF_ROLES = ['BARBER', 'CASHIER', 'MANAGER', 'SALON_OWNER', 'SUPER_ADMIN', 'SKINNER'];
  const isStaffRole = userRole && STAFF_ROLES.includes(userRole);
  const shouldHide = isStaffPage || isStaffRole;

  useEffect(() => {
    // Luôn tạo session mới khi reload trang (Theo Option A)
    setSessionId(uuidv4());
  }, []);

  const handleResetChat = () => {
    setSessionId(uuidv4());
    setMessages([]);
    setInput('');
    setLastFailedMessage(null);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const MAX_AUTO_RETRIES = 2;

  const callAPI = async (text: string): Promise<string> => {
    const response = await axios.post('/api/ai/chat', {
      message: text,
      session_id: sessionId,
    }, { timeout: 30000 });
    return response.data.response;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: text,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setLastFailedMessage(null);

    let lastErr: any = null;
    for (let attempt = 0; attempt <= MAX_AUTO_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff: 2s, 4s
          await new Promise(r => setTimeout(r, attempt * 2000));
        }
        const aiResponse = await callAPI(text);
        const assistantMsg: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: aiResponse,
          createdAt: new Date(),
        };
        setMessages(prev => [...prev, assistantMsg]);
        setRetryCount(0);
        setIsLoading(false);
        return; // success — exit
      } catch (error: any) {
        lastErr = error;
        const status = error?.response?.status;
        // Don't retry on 429 — wait is too long
        if (status === 429) break;
      }
    }

    // All retries failed — show error to user
    const status = lastErr?.response?.status;
    let errorText: string;
    if (status === 429) {
      errorText = '⏳ Hệ thống đang bận, vui lòng đợi 30 giây rồi thử lại nhé!';
    } else if (lastErr?.code === 'ECONNABORTED') {
      errorText = '⏱️ Phản hồi hơi lâu, anh thử lại nhé!';
    } else {
      errorText = 'Xin lỗi, em gặp sự cố. Anh thử lại sau nhé! 🙏';
    }
    setLastFailedMessage(text);

    const errorMsg: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: errorText,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, errorMsg]);
    setRetryCount(prev => prev + 1);
    setIsLoading(false);
  };

  const handleSend = () => sendMessage(input);

  const handleRetry = () => {
    if (lastFailedMessage) {
      sendMessage(lastFailedMessage);
    }
  };

  const handleSuggestion = (text: string) => {
    sendMessage(text);
  };

  // Hide chatbot for staff users
  if (shouldHide) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-[#C8A97E] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-200 group"
        >
          <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[380px] h-[550px] bg-white rounded-2xl shadow-[-10px_10px_30px_rgba(0,0,0,0.1)] border border-[#E8E0D4] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-[#1A1A1A] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C8A97E] flex items-center justify-center">
                <Bot className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Reetro Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-gray-400">Đang trực tuyến</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleResetChat}
                  title="Làm mới hội thoại"
                  className="p-2 hover:bg-[#C8A97E]/20 rounded-full transition-colors text-[#C8A97E]"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF8F5] scroll-smooth"
          >
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="text-center py-6 space-y-3">
                  <Bot className="w-12 h-12 text-[#C8A97E]/30 mx-auto" />
                  <p className="text-sm text-gray-500 max-w-[220px] mx-auto">
                    Chào anh! Em là trợ lý AI của Reetro Barber. Anh cần hỗ trợ gì ạ?
                  </p>
                </div>

                {/* Suggested Questions */}
                <div className="grid grid-cols-2 gap-2">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestion(q.text)}
                      className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-xl border border-[#E8E0D4] text-xs font-medium text-[#5C4A32] hover:border-[#C8A97E] hover:bg-[#C8A97E]/5 transition-all text-left"
                    >
                      <span>{q.emoji}</span>
                      <span>{q.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-2 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border shadow-sm",
                  msg.role === 'user' ? "bg-white border-gray-200" : "bg-[#C8A97E] border-[#C8A97E]"
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-gray-600" /> : <Bot className="w-4 h-4 text-black" />}
                </div>
                <div className={cn(
                  "p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm whitespace-pre-wrap transition-all duration-200",
                  msg.role === 'user'
                    ? "bg-[#1A1A1A] text-white rounded-tr-none max-w-[75%]"
                    : "bg-white text-gray-800 border border-[#E8E0D4] rounded-tl-none max-w-[80%]"
                )}>
                  {msg.content.split('\n').map((line, i) => {
                    const parts = line.split(/(\*\*.*?\*\*)/g);
                    const formattedLine = parts.map((part, index) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={index} className="font-bold text-[#C8A97E]">{part.slice(2, -2)}</strong>;
                      }
                      return part;
                    });

                    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                      return (
                        <div key={i} className="flex gap-2 my-1 pl-1">
                          <span className="text-[#C8A97E] mt-1 flex-shrink-0">●</span>
                          <div className="flex-1">
                            {formattedLine.map(p => typeof p === 'string' ? p.trim().replace(/^[•-]\s*/, '') : p)}
                          </div>
                        </div>
                      );
                    }

                    return <p key={i} className={cn(line.trim() === "" ? "h-2" : "mb-1")}>{formattedLine}</p>;
                  })}
                </div>
              </div>
            ))}

            {/* Retry Button */}
            {lastFailedMessage && !isLoading && (
              <div className="flex justify-center">
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-4 py-2 bg-[#C8A97E]/10 text-[#C8A97E] rounded-full text-xs font-semibold hover:bg-[#C8A97E]/20 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Thử lại
                </button>
              </div>
            )}

            {isLoading && (
              <div className="flex items-start gap-2 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-[#C8A97E] flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Bot className="w-4 h-4 text-black" />
                </div>
                <div className="bg-white border border-[#E8E0D4] p-3 rounded-2xl rounded-tl-none">
                  <Loader2 className="w-4 h-4 animate-spin text-[#C8A97E]" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-[#E8E0D4]">
            <div className="relative flex items-center gap-2">
              <input
                type="text"
                placeholder="Gõ tin nhắn..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-[#FAF8F5] border border-[#E8E0D4] rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#C8A97E] transition-all"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="w-10 h-10 bg-[#C8A97E] text-black rounded-full flex items-center justify-center hover:bg-[#B8986E] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-center text-gray-400 mt-3 font-medium tracking-wide uppercase">
              Reetro Premium Service
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
