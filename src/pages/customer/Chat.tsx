import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  User, 
  Loader2, 
  MessageSquare, 
  ShieldCheck,
  ArrowLeft,
  X,
  Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../hooks/useChat';
import { format } from 'date-fns';
import { safeFormat } from '../../utils/date';
import { useNavigate } from 'react-router-dom';
import { emailService } from '../../services/emailService';

const CustomerChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  // Assuming admin ID is 'admin' for now. In a real app, you might fetch available support agents.
  const { messages, sendMessage, isOnline } = useChat('admin');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    const msgText = input.trim();
    setInput('');
    sendMessage(msgText);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-15.5rem)] sm:h-[calc(100vh-12rem)] flex flex-col">
      <div className="bg-white border border-slate-200 rounded-t-3xl p-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
            title="Go Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="relative">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
            </div>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
          </div>
          <div>
            <h3 className="font-bold text-slate-900">ECONEST Instant Support</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              {isOnline ? 'Online - Instant Live Assistance' : 'Offline - Agents review shortly'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
            title="Close & Return to Dashboard"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 bg-slate-50 border-x border-slate-200 overflow-y-auto p-4 sm:p-6 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
              <MessageSquare className="h-8 w-8 text-slate-300" />
            </div>
            <h4 className="font-bold text-slate-900 mb-2">Start a Conversation</h4>
            <p className="text-sm text-slate-500 max-w-xs">
              Our support team is available 24/7 to help you with any banking inquiries.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === user?.id || !msg.isAdmin;
            return (
              <div 
                key={i} 
                className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'} my-1.5`}
              >
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm ${
                  isMe 
                    ? 'bg-emerald-600 text-white rounded-tr-none ml-auto' 
                    : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none mr-auto'
                }`}>
                  <p className={`text-[10px] font-bold mb-1 ${isMe ? 'text-emerald-100 text-right' : 'text-slate-400 text-left'}`}>
                    {isMe ? 'You' : 'ECONEST Live Support'}
                  </p>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className={`text-[10px] mt-1.5 ${isMe ? 'text-right text-emerald-200' : 'text-left text-slate-400'}`}>
                    {safeFormat(msg.createdAt, 'HH:mm')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-b-3xl p-4">
        <form onSubmit={handleSend} className="flex gap-4">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="bg-emerald-600 text-white p-3 rounded-2xl hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20"
          >
            <Send className="h-6 w-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerChat;
