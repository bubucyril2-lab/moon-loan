import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Send, MessageSquare, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../hooks/useChat';
import { format } from 'date-fns';
import { safeFormat } from '../../utils/date';

interface Customer {
  id: number;
  full_name: string;
  email: string;
  status: string;
}

const AdminChat = () => {
  const { token, user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  
  const { messages, sendMessage, isOnline } = useChat(selectedCustomer?.id);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      const res = await fetch('/api/admin/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCustomers(data);
    };
    fetchCustomers();
  }, [token]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedCustomer) return;
    sendMessage(input);
    setInput('');
  };

  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-8">
      {/* Customer List */}
      <div className="w-80 bg-white border border-slate-200 rounded-3xl flex flex-col overflow-hidden shadow-sm">
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
              <div className="text-left overflow-hidden">
                <p className={`text-sm font-bold truncate ${selectedCustomer?.id === customer.id ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {customer.full_name}
                </p>
                <p className="text-xs text-slate-500 truncate">{customer.email}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-white border border-slate-200 rounded-3xl flex flex-col overflow-hidden shadow-sm">
        {selectedCustomer ? (
          <>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <User className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{selectedCustomer.full_name}</h3>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter">{selectedCustomer.status} Account</p>
                </div>
              </div>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 bg-slate-50 overflow-y-auto p-6 space-y-4"
            >
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                    msg.sender_id === user?.id 
                      ? 'bg-slate-900 text-white rounded-tr-none' 
                      : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    <p className={`text-[10px] mt-2 opacity-60 ${msg.sender_id === user?.id ? 'text-right' : 'text-left'}`}>
                      {safeFormat(msg.created_at, 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
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
  );
};

export default AdminChat;
