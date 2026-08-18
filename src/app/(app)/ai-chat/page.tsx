'use client';

// ============================================================
// RemindMe — AI Health Chat Page
// Conversational AI with user's own BP data as context (RAG)
// Supports Hindi, Hinglish, and English
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, Sparkles, RefreshCw, Heart, Zap, MessageCircle,
  Loader2, User,
} from 'lucide-react';
import { useBpStore } from '@/stores/bpStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  'Mera BP iss hafte kaisa tha?',
  'Write a short daily motivation quote',
  'Suggest a healthy dinner recipe',
  'How to reduce BP naturally?',
  'Write an email draft to my boss',
  'Explain quantum computing simply',
];

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `Namaste! 👋 Main aapka personal AI Assistant hoon, powered by NVIDIA NIM.

Aap mujhse kuch bhi puch sakte hain — general knowledge, writing, motivation, coding, ya fir aapke reminders aur blood pressure data ke baare mein!

Aap mujhse ye sab puch sakte hain:
• **General Questions:** "Tell me a joke", "Write an email draft", "Explain a concept"
• **Health & BP Trends:** "Mera BP trend kaisa hai?", "Suggest lifestyle tips"
• **Productivity:** "Help me structure my day"

Hindi, Hinglish, ya English — jaise chahein baat karein! 😊`,
  timestamp: new Date(),
};

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { readings, medicines, goal } = useBpStore();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/ai/health-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history,
          readings: readings.slice(-30).map(r => ({
            systolic: r.systolic,
            diastolic: r.diastolic,
            pulse: r.pulse,
            date: r.date,
            time: r.time,
            timeOfDay: r.timeOfDay,
            categoryLabel: r.categoryLabel,
          })),
          medicines: medicines.map(m => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            active: m.active,
          })),
          goal,
        }),
      });

      if (!res.ok) throw new Error();
      const { reply } = await res.json();

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, kuch technical problem ho gayi. Please thoda wait karke dobara try karein. 🙏',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleClear = () => {
    setMessages([WELCOME_MESSAGE]);
  };

  const avgBp = readings.length > 0
    ? `${Math.round(readings.slice(-10).reduce((s, r) => s + r.systolic, 0) / Math.min(readings.length, 10))}/${Math.round(readings.slice(-10).reduce((s, r) => s + r.diastolic, 0) / Math.min(readings.length, 10))}`
    : null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[900px]">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            AI Assistant
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5 ml-10">
            Powered by NVIDIA NIM · Personal BP context enabled
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Context Pills */}
          {readings.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] text-xs text-[var(--text-tertiary)]">
              <Heart size={11} className="text-pink-400" />
              <span>{readings.length} readings</span>
              {avgBp && <span className="text-indigo-400 font-semibold">· avg {avgBp}</span>}
            </div>
          )}
          <button
            onClick={handleClear}
            className="p-2 rounded-xl text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
            title="Clear chat"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--shadow-md)]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={cn('flex gap-2.5', msg.role === 'user' && 'flex-row-reverse')}
              >
                {/* Avatar */}
                <div className={cn(
                  'h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                  msg.role === 'assistant'
                    ? 'bg-gradient-to-br from-violet-600 to-indigo-600'
                    : 'bg-gradient-to-br from-[var(--accent)] to-purple-500',
                )}>
                  {msg.role === 'assistant'
                    ? <Sparkles size={13} className="text-white" />
                    : <User size={13} className="text-white" />}
                </div>

                {/* Bubble */}
                <div className={cn(
                  'max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'assistant'
                    ? 'bg-[var(--surface-2)] text-[var(--text-primary)] rounded-tl-sm'
                    : 'bg-gradient-to-br from-[var(--accent)] to-purple-600 text-white rounded-tr-sm',
                )}>
                  {/* Parse simple bold markdown */}
                  <p style={{ whiteSpace: 'pre-wrap' }}>
                    {msg.content.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                      i % 2 === 1
                        ? <strong key={i}>{part}</strong>
                        : part
                    )}
                  </p>
                  <p className={cn(
                    'text-[10px] mt-1.5',
                    msg.role === 'assistant' ? 'text-[var(--text-tertiary)]' : 'text-white/60',
                  )}>
                    {format(msg.timestamp, 'hh:mm a')}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {sending && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2.5"
            >
              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
                <Loader2 size={13} className="text-white animate-spin" />
              </div>
              <div className="bg-[var(--surface-2)] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="h-2 w-2 rounded-full bg-violet-400"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length <= 1 && !sending && (
          <div className="px-4 pb-2">
            <p className="text-[10px] text-[var(--text-tertiary)] mb-2 flex items-center gap-1">
              <MessageCircle size={10} /> Quick questions:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[10px] text-[var(--text-secondary)] hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-400 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-1)]">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Zap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                ref={inputRef}
                id="ai-chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Apna sawaal puchen... (Hindi / English)"
                className={cn(
                  'w-full h-11 pl-9 pr-4 rounded-xl text-sm',
                  'bg-[var(--surface-2)] border border-[var(--border)]',
                  'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                  'outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10',
                  'transition-all',
                )}
                disabled={sending}
                autoComplete="off"
              />
            </div>
            <motion.button
              type="submit"
              disabled={!input.trim() || sending}
              whileTap={{ scale: 0.92 }}
              className={cn(
                'h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-all',
                input.trim() && !sending
                  ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:opacity-90'
                  : 'bg-[var(--surface-2)] text-[var(--text-tertiary)] cursor-not-allowed',
              )}
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </motion.button>
          </form>
          <p className="text-[10px] text-[var(--text-tertiary)] text-center mt-2">
            ⚕️ AI responses are informational only. Consult your doctor for medical decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
