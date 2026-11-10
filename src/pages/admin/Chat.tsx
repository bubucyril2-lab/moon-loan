import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, Send, MessageSquare, ShieldCheck, Loader2, ArrowLeft, X, Mail, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../hooks/useChat';
import { storageService } from '../../services/storage';
import { emailService } from '../../services/emailService';
import { format } from 'date-fns';
import { safeFormat } from '../../utils/date';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  full_name: string;
  email: string;
  status: string;
}

const AdminChat = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  
  const { messages, sendMessage } = useChat(selectedCustomer?.id);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      const users = (await storageService.getUsers()).filter(u => u.role === 'customer');
      setCustomers(users.map(u => ({
        id: u.id,
        full_name: u.fullName || u.full_name || '',
        email: u.email,
        status: u.status || 'active'
      })));
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedCustomer) return;
    const msgText = input.trim();
    sendMessage(msgText);
    setInput('');
    toast.success(`Live response sent to ${selectedCustomer.full_name}`);
  };

  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top Communication Desk Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl w-fit border border-slate-300/60 shadow-2xs">
        <Link
          to="/admin/email-chat"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white/60 transition-all"
        >
          <Mail className="h-4 w-4 text-emerald-600" />
          <span>SendGrid Email Chat Space</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </Link>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-900 shadow-sm">
          <MessageSquare className="h-4 w-4 text-indigo-600" />
          <span>Customer Live Support</span>
        </div>
      </div>

      <div className="h-[calc(100vh-19rem)] md:h-[calc(100vh-15rem)] min-h-[480px] flex flex-col md:flex-row gap-4 md:gap-8">
      {/* Customer List */}
      <div className={`${selectedCustomer ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-white border border-slate-200 rounded-3xl flex-col overflow-hidden shadow-sm`}>
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 mb-4">Conversations</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredCustomers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => setSelectedCustomer(customer)}
              className={`w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-all border-b border-slate-50 ${
                selectedCustomer?.id === customer.id ? 'bg-emerald-50 border-emerald-100' : ''
              }`}
            >
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-slate-600" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className={`text-sm font-bold break-words ${selectedCustomer?.id === customer.id ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {customer.full_name}
                </p>
                <p className="text-xs text-slate-500 break-all mt-0.5">{customer.email}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`${selectedCustomer ? 'flex' : 'hidden md:flex'} flex-1 bg-white border border-slate-200 rounded-3xl flex-col overflow-hidden shadow-sm`}>
        {selectedCustomer ? (
          <>
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
                  title="Return to Customer Conversations"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <User className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{selectedCustomer.full_name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">{selectedCustomer.email}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold uppercase">
                      {selectedCustomer.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-700"
                  title="Close Customer Chat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 bg-slate-50 overflow-y-auto p-4 sm:p-6 space-y-3"
            >
              {messages.map((msg, idx) => {
                const isMe = msg.isAdmin || msg.senderId === user?.id;
                return (
                  <div 
                    key={`${msg.id || 'msg'}-${idx}`} 
                    className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'} my-1.5`}
                  >
                    <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm ${
                      isMe 
                        ? 'bg-slate-900 text-white rounded-tr-none ml-auto' 
                        : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none mr-auto'
                    }`}>
                      <p className={`text-[10px] font-bold mb-1 ${isMe ? 'text-slate-300 text-right' : 'text-slate-400 text-left'}`}>
                        {isMe ? 'You (Admin)' : selectedCustomer.full_name}
                      </p>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p className={`text-[10px] mt-1.5 ${isMe ? 'text-right text-slate-400' : 'text-left text-slate-400'}`}>
                        {safeFormat(msg.createdAt, 'HH:mm')}
                      </p>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
                  <p className="text-sm italic">No messages yet. Start the conversation.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100">
              <form onSubmit={handleSend} className="flex gap-4">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a reply..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <button 
                  type="submit"
                  disabled={!input.trim()}
                  className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  <Send className="h-6 w-6" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
              <MessageSquare className="h-10 w-10 opacity-20" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Select a Customer</h3>
            <p className="max-w-xs text-sm">
              Choose a customer from the list on the left to start a support conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
  );
};

export default AdminChat;
