// ============================================================
// LearnSpace - Messages Page
// Two-column layout: conversation list + thread view
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { messageAPI } from '../services/api';
import useAuthStore from '../context/authStore';
import { Loader, EmptyState } from '../components/common/UI';
import { toast } from 'react-toastify';

const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60)       return 'just now';
  if (diff < 3600)     return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)    return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)   return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};

const MessagesPage = () => {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const initialReceiver = searchParams.get('to');

  const [conversations, setConversations] = useState([]);
  const [selected, setSelected]   = useState(null); // { _id, name, role, avatar }
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);

  const scrollRef = useRef(null);

  const loadConversations = async () => {
    try {
      const res = await messageAPI.conversations();
      setConversations(res.data?.data?.conversations || []);
    } catch {
      // silent
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // If ?to=userId is in URL, pre-select that conversation (or create a new one)
  useEffect(() => {
    if (!initialReceiver || selected) return;
    // Try to find existing conversation
    const existing = conversations.find(c => String(c.partner._id) === String(initialReceiver));
    if (existing) {
      setSelected(existing.partner);
    } else {
      // Placeholder — will populate after first message sent
      setSelected({ _id: initialReceiver, name: 'New conversation', role: '' });
    }
  }, [initialReceiver, conversations, selected]);

  const loadThread = async (partnerId) => {
    setLoadingThread(true);
    try {
      const res = await messageAPI.thread(partnerId);
      setMessages(res.data?.data?.messages || []);
      // Refresh conversation list to update read state
      loadConversations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load messages.');
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    if (selected?._id) loadThread(selected._id);
    // eslint-disable-next-line
  }, [selected?._id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selected?._id || sending) return;
    setSending(true);
    try {
      const res = await messageAPI.send({
        receiver_id: selected._id,
        content: input.trim()
      });
      const newMsg = res.data?.data?.message;
      if (newMsg) {
        setMessages(prev => [...prev, newMsg]);
      }
      setInput('');
      loadConversations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[600px]">

        {/* Conversation List */}
        <div className="border-r border-gray-100 overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">Conversations</p>
          </div>
          {loadingConvs ? (
            <div className="p-6"><Loader size="sm" /></div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8 px-4">
              No conversations yet. Message someone from their profile or course page.
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {conversations.map(c => {
                const isActive = selected?._id && String(c.partner._id) === String(selected._id);
                return (
                  <button
                    key={c.partner._id}
                    onClick={() => setSelected(c.partner)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${isActive ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0 overflow-hidden">
                        {c.partner.avatar ? (
                          <img src={c.partner.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-sm font-semibold">
                            {c.partner.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium text-gray-900 truncate">{c.partner.name}</p>
                          {c.unread > 0 && (
                            <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 shrink-0 ml-2">
                              {c.unread}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {c.last_message?.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {c.last_message?.createdAt && timeAgo(c.last_message.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Thread */}
        <div className="md:col-span-2 flex flex-col">
          {!selected ? (
            <EmptyState
              icon={<span className="text-3xl">💬</span>}
              title="Select a conversation"
              description="Choose a conversation from the left to start chatting."
            />
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden">
                  {selected.avatar ? (
                    <img src={selected.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-sm font-semibold">
                      {selected.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selected.name}</p>
                  {selected.role && (
                    <p className="text-xs text-gray-500 capitalize">{selected.role}</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                {loadingThread ? (
                  <Loader size="sm" />
                ) : messages.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-8">
                    No messages yet. Say hello 👋
                  </p>
                ) : (
                  messages.map(m => {
                    const mine = String(m.sender_id?._id || m.sender_id) === String(user._id || user.id);
                    return (
                      <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                          mine
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                        }`}>
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          <p className={`text-xs mt-1 ${mine ? 'text-blue-100' : 'text-gray-400'}`}>
                            {timeAgo(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input */}
              <form onSubmit={send} className="flex gap-2 p-3 border-t border-gray-100 bg-white">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sending}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
