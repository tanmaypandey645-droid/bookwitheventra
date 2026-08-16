import React, { useState } from 'react';
import { Sparkles, Send, Bot, User as UserIcon, X, Loader2, ArrowRight, Compass } from 'lucide-react';
import { Event, User } from '../types';

interface EventraAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  events: Event[];
  currentUser: User;
  onSelectEvent: (event: Event) => void;
  onBookNow: (event: Event) => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  matchedEventIds?: string[];
  timestamp: string;
}

export const EventraAIAssistant: React.FC<EventraAIAssistantProps> = ({
  isOpen,
  onClose,
  events,
  currentUser,
  onSelectEvent,
  onBookNow
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_1',
      sender: 'ai',
      text: `Hello ${currentUser.name.split(' ')[0]}! 👋 I'm **Eventra AI**, your personal college event discovery and outing planner.\n\nHow can I help you today? You can ask me to find events, filter by ticket price, suggest hackathons, or plan an outing with friends!`,
      timestamp: 'Just now'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    "Find tech events & hackathons this month",
    "Show me events under ₹500",
    "What events are near Ghaziabad & Delhi?",
    "Recommend a music concert or standup comedy"
  ];

  const handleSend = async (queryText?: string) => {
    const promptToUse = queryText || inputPrompt;
    if (!promptToUse.trim()) return;

    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: promptToUse,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          events: events,
          userContext: {
            name: currentUser.name,
            college: currentUser.college,
            city: currentUser.city,
            interests: currentUser.interests
          }
        })
      });

      const data = await response.json();
      
      // Match referenced events in AI response
      const matchedIds = events
        .filter(e => data.reply && data.reply.toLowerCase().includes(e.title.toLowerCase().substring(0, 10)))
        .map(e => e.id);

      const aiMsg: ChatMessage = {
        id: 'ai_' + Date.now(),
        sender: 'ai',
        text: data.reply || 'Here are some recommendations based on your request.',
        matchedEventIds: matchedIds.length > 0 ? matchedIds : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: 'ai_err_' + Date.now(),
          sender: 'ai',
          text: "I couldn't reach the AI server at the moment, but you can explore all trending events on the main Eventra Discover tab!",
          timestamp: 'Just now'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl h-[85vh] max-h-[680px] bg-[#0c0c0c] border border-orange-400/25 rounded-3xl shadow-2xl flex flex-col overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-400 to-amber-400 p-[1.5px]">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center text-orange-300">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base sm:text-lg flex items-center gap-2">
                <span>Eventra AI</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-400/15 text-orange-300 border border-orange-400/25 rounded-full">
                  Gemini Powered
                </span>
              </h3>
              <p className="text-xs text-zinc-400">Smart College Event Discovery & Outing Assistant</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-orange-400/10 border border-orange-400/25 text-orange-300 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] space-y-3 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-zinc-950 font-bold rounded-tr-none shadow-md shadow-orange-400/15'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Event Action Cards generated in response */}
                {msg.matchedEventIds && msg.matchedEventIds.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] font-bold text-orange-300">Recommended Event Cards:</p>
                    {msg.matchedEventIds.map(id => {
                      const evt = events.find(e => e.id === id);
                      if (!evt) return null;
                      const minPrice = Math.min(...evt.ticketTypes.map(t => t.price));

                      return (
                        <div key={evt.id} className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 text-left">
                          <div className="overflow-hidden">
                            <p className="font-extrabold text-white text-xs line-clamp-1">{evt.title}</p>
                            <p className="text-[11px] text-zinc-400">{evt.date} • {evt.venue}</p>
                            <p className="text-[11px] text-orange-300 font-bold mt-0.5">
                              {minPrice === 0 ? 'FREE Entry' : `From ₹${minPrice}`}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              onClose();
                              onBookNow(evt);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-orange-400 hover:bg-orange-300 text-zinc-950 text-xs font-black shrink-0"
                          >
                            Book
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <span className="text-[10px] text-zinc-500 block px-1">
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center shrink-0 mt-1">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-xs text-orange-300 font-bold p-2 bg-orange-400/10 border border-orange-400/20 rounded-xl w-fit">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Eventra AI is checking real events database...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts Chips */}
        <div className="px-4 py-2 bg-zinc-950/80 border-t border-zinc-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-zinc-500 shrink-0 uppercase tracking-wider">Try Asking:</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="px-3 py-1 bg-zinc-900 border border-zinc-800 hover:border-orange-400/40 rounded-full text-[11px] text-zinc-300 hover:text-white whitespace-nowrap shrink-0 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask Eventra AI for events, tickets, prices, or outing plans..."
              className="flex-1 px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-orange-400/60"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isLoading}
              className="p-3 rounded-2xl bg-gradient-to-r from-orange-400 to-amber-400 disabled:opacity-50 text-zinc-950 font-black shadow-md shadow-orange-400/15 hover:brightness-105 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
