'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Khởi tạo sessionId duy nhất
  useEffect(() => {
    const savedSession = localStorage.getItem('ai_chat_session');
    if (savedSession) {
      setSessionId(savedSession);
    } else {
      const newSession = uuidv4();
      setSessionId(newSession);
      localStorage.setItem('ai_chat_session', newSession);
    }
  }, []);

  // Cuộn xuống cuối khi có tin mới
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: input,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/ai/chat', {
        message: input,
        session_id: sessionId,
      });

      const assistantMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response.data.response,
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Xin lỗi, em đang gặp sự cố kết nối. Anh vui lòng thử lại sau nhé! 🙏',
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Nút Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-[#C8A97E] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-200 group"
        >
          <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Cửa sổ Chat */}
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
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF8F5] scroll-smooth"
          >
            {messages.length === 0 && (
              <div className="text-center py-10 space-y-3">
                <Bot className="w-12 h-12 text-[#C8A97E]/30 mx-auto" />
                <p className="text-sm text-gray-500 max-w-[200px] mx-auto">
                  Chào anh! Em là trợ lý AI của Reetro Barber. Anh cần đặt lịch hay tư vấn gì không ạ?
                </p>
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
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border",
                  msg.role === 'user' ? "bg-white border-gray-200" : "bg-[#C8A97E] border-[#C8A97E]"
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-gray-600" /> : <Bot className="w-4 h-4 text-black" />}
                </div>
                <div className={cn(
                  "p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                  msg.role === 'user' 
                    ? "bg-[#1A1A1A] text-white rounded-tr-none" 
                    : "bg-white text-gray-800 border border-[#E8E0D4] rounded-tl-none"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}

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
