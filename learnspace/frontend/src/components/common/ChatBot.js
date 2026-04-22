// ============================================================
// LearnSpace - Chatbot Widget
// Floating bottom-right launcher + chat window. Calls
// POST /api/chatbot/message which works for guests AND users.
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const ChatBot = () => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState([
    'How do I enroll?',
    'Payment methods?',
    'My courses',
    'Get certificate'
  ]);
  const scrollRef = useRef(null);

  // Initial greeting on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'bot', text: t('bot.greeting') }]);
    }
  }, [open]);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const send = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || sending) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text: trimmed }]);
    setSending(true);
    try {
      const res = await api.post('/chatbot/message', { message: trimmed });
      const reply = res.data?.data?.reply || 'Sorry, I had trouble processing that.';
      const newSuggestions = res.data?.data?.suggestions;
      setMessages(m => [...m, { role: 'bot', text: reply }]);
      if (Array.isArray(newSuggestions) && newSuggestions.length) {
        setSuggestions(newSuggestions);
      }
    } catch (err) {
      setMessages(m => [...m, { role: 'bot', text: 'Network error. Please try again.' }]);
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    send();
  };

  const isBn = i18n.language?.startsWith('bn');

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={t('bot.open')}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-forest-700 hover:bg-forest-800 text-amber-300 rounded-full shadow-vintage-lg hover:shadow-2xl transition-all flex items-center justify-center group border-2 border-amber-400/40"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {isBn ? 'সহকারী' : 'Need help?'}
          </span>
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-40 w-80 sm:w-96 max-w-[calc(100vw-3rem)] h-[32rem] max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-forest-gradient text-cream-50 px-4 py-3 shrink-0 border-b-2 border-amber-400/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-400/20 rounded-full flex items-center justify-center text-sm">
                🤖
              </div>
              <div>
                <p className="font-display text-sm font-bold leading-none">{t('bot.title')}</p>
                <p className="text-xs text-amber-300 mt-0.5 italic">Online</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-cream-200 hover:text-cream-50 p-1 rounded-md hover:bg-forest-800/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-line ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3.5 py-2 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && suggestions.length > 0 && (
            <div className="px-3 pb-2 flex gap-2 flex-wrap shrink-0 bg-gray-50">
              {suggestions.slice(0, 4).map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  disabled={sending}
                  className="text-xs bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-600 px-2.5 py-1 rounded-full transition-colors disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={onSubmit} className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 bg-white shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('bot.placeholder')}
              disabled={sending}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label={t('bot.send')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBot;
