import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, 
  Send, 
  Search, 
  Check, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  MessageSquare, 
  ArrowLeft, 
  User, 
  DollarSign, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Filter, 
  X, 
  ChevronRight, 
  AlertCircle, 
  Plus,
  Loader2,
  Building,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams, Link } from 'react-router-dom';
import { emailService } from '../../services/emailService';
import { storageService } from '../../services/storage';
import { ReceiverThread, ReceiverThreadMessage } from '../../types';
import { safeFormat } from '../../utils/date';
import toast from 'react-hot-toast';

export const EmailChatSpace: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedThreadId = searchParams.get('threadId');

  const [threads, setThreads] = useState<ReceiverThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ReceiverThread | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'recent'>('all');

  // Compose Message State
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // New Thread Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newReceiverEmail, setNewReceiverEmail] = useState('');
  const [newReceiverName, setNewReceiverName] = useState('');
  const [newRefId, setNewRefId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isCreatingThread, setIsCreatingThread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedThread?.messages]);

  // Fetch threads from backend
  const fetchThreads = async (silent = false) => {
    try {
      if (!silent) setIsRefreshing(true);
      const data = await emailService.getReceiverThreads();
      setThreads(data);

      // Keep selected thread in sync with latest data
      if (selectedThread) {
        const updated = data.find(t => t.threadId === selectedThread.threadId);
        if (updated) {
          setSelectedThread(updated);
        }
      } else if (requestedThreadId) {
        const found = data.find(t => t.threadId === requestedThreadId || t.referenceId === requestedThreadId);
        if (found) {
          setSelectedThread(found);
          setSubject(`Update regarding Transfer Ref #${found.referenceId}`);
          markAsRead(found.threadId);
        }
      } else if (data.length > 0 && window.innerWidth >= 768 && !selectedThread) {
        setSelectedThread(data[0]);
        setSubject(`Update regarding Transfer Ref #${data[0].referenceId}`);
      }
    } catch (err) {
      console.warn('Error fetching email threads:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchThreads();
    const interval = setInterval(() => {
      fetchThreads(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // When selected thread changes, mark as read and update subject
  const handleSelectThread = (thread: ReceiverThread) => {
    setSelectedThread(thread);
    setSearchParams({ threadId: thread.threadId });
    setSubject(`[ECONEST BANK] Update regarding Transfer Ref #${thread.referenceId}`);
    if (thread.hasUnreadReply) {
      markAsRead(thread.threadId);
    }
  };

  const markAsRead = async (threadId: string) => {
    try {
      await emailService.markThreadRead(threadId);
      setThreads(prev => prev.map(t => t.threadId === threadId ? { ...t, hasUnreadReply: false } : t));
    } catch (e) {
      console.warn('Could not mark thread as read:', e);
    }
  };

  // Send message via SendGrid
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedThread || !message.trim()) return;

    try {
      setIsSending(true);
      const result = await emailService.sendReceiverMessage({
        threadId: selectedThread.threadId,
        referenceId: selectedThread.referenceId,
        receiverEmail: selectedThread.receiverEmail,
        receiverName: selectedThread.receiverName,
        senderName: selectedThread.senderName,
        senderEmail: selectedThread.senderEmail,
        amount: selectedThread.amount,
        currency: selectedThread.currency,
        bankName: selectedThread.bankName,
        subject: subject.trim() || `Update regarding Transfer #${selectedThread.referenceId}`,
        message: message.trim(),
        adminName: user?.fullName || 'ECONEST Bank Administration'
      });

      if (result.success) {
        toast.success(`Message dispatched via SendGrid to ${selectedThread.receiverEmail}!`);
        setMessage('');
        if (result.thread) {
          setSelectedThread(result.thread);
          setThreads(prev => {
            const idx = prev.findIndex(t => t.threadId === result.thread.threadId);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = result.thread;
              return copy;
            }
            return [result.thread, ...prev];
          });
        }
      } else {
        toast.error(result.error || 'Failed to dispatch email via SendGrid');
      }
    } catch (err: any) {
      toast.error('Send error: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSending(false);
    }
  };

  // Create new thread & send initial message
  const handleCreateNewThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReceiverEmail.trim() || !newReceiverEmail.includes('@')) {
      toast.error('Please enter a valid receiver email address.');
      return;
    }
    if (!newMessage.trim()) {
      toast.error('Please enter an initial message to dispatch.');
      return;
    }

    try {
      setIsCreatingThread(true);
      const genRef = newRefId.trim() || 'TXN-' + Math.random().toString(36).substr(2, 8).toUpperCase();
      const result = await emailService.sendReceiverMessage({
        referenceId: genRef,
        receiverEmail: newReceiverEmail.trim(),
        receiverName: newReceiverName.trim() || 'Beneficiary',
        amount: parseFloat(newAmount) || 0,
        currency: 'USD',
        bankName: newBankName.trim() || 'Beneficiary Bank',
        subject: newSubject.trim() || `Official Communication regarding Transfer Ref #${genRef}`,
        message: newMessage.trim(),
        adminName: user?.fullName || 'ECONEST Bank Administration'
      });

      if (result.success && result.thread) {
        toast.success(`New conversation created and email dispatched to ${newReceiverEmail}!`);
        setIsNewModalOpen(false);
        // Reset form
        setNewReceiverEmail('');
        setNewReceiverName('');
        setNewRefId('');
        setNewAmount('');
        setNewBankName('');
        setNewSubject('');
        setNewMessage('');

        // Select the newly created thread
        setThreads(prev => [result.thread, ...prev.filter(t => t.threadId !== result.thread.threadId)]);
        setSelectedThread(result.thread);
        setSearchParams({ threadId: result.thread.threadId });
      } else {
        toast.error(result.error || 'Failed to initiate conversation via SendGrid');
      }
    } catch (err: any) {
      toast.error('Error: ' + (err.message || 'Could not create conversation'));
    } finally {
      setIsCreatingThread(false);
    }
  };

  // Copy receiver public reply URL
  const copyReplyUrl = (thread: ReceiverThread) => {
    const url = `${window.location.origin}/reply/${thread.threadId}?token=${thread.replyToken}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success('Public Response Portal Link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Quick reply chip click
  const insertQuickTemplate = (text: string) => {
    setMessage(prev => prev ? `${prev}\n\n${text}` : text);
  };

  // Filter threads
  const filteredThreads = threads.filter(thread => {
    const matchesSearch = 
      thread.receiverEmail.toLowerCase().includes(search.toLowerCase()) ||
      thread.receiverName.toLowerCase().includes(search.toLowerCase()) ||
      thread.referenceId.toLowerCase().includes(search.toLowerCase()) ||
      (thread.senderEmail && thread.senderEmail.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'unread') {
      return thread.hasUnreadReply;
    }
    if (filterTab === 'recent') {
      const today = new Date().toDateString();
      return new Date(thread.lastUpdated).toDateString() === today;
    }
    return true;
  });

  const unreadCount = threads.filter(t => t.hasUnreadReply).length;

  return (
    <div className="h-[calc(100vh-8.5rem)] min-h-[580px] flex flex-col bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Top Banner / Global Bar */}
      <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black tracking-tight text-white">SendGrid Email Chat Space</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Two-Way SendGrid Delivery
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Send messages straight to receiver Gmail inboxes via SendGrid • Receive replies in real-time chat format
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchThreads(false)}
            disabled={isRefreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            title="Refresh conversations"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden md:inline">Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-95 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Email Chat</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Thread List & Right Chat Space */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-white">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: CONVERSATION THREADS LIST                    */}
        {/* ========================================================= */}
        <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-200 bg-slate-50/50 shrink-0 ${selectedThread ? 'hidden md:flex' : 'flex'}`}>
          {/* Search & Filter Header */}
          <div className="p-3.5 border-b border-slate-200 bg-white space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search email, name, ref #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  filterTab === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>All ({threads.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('unread')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  filterTab === 'unread'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Unread Replies</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('recent')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterTab === 'recent'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Today</span>
              </button>
            </div>
          </div>

          {/* Threads Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto" />
                <p className="text-xs">Loading email threads...</p>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Mail className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No email conversations found</p>
                <p className="text-[11px] text-slate-400">
                  {search ? 'Try clearing your search query.' : 'Click "New Email Chat" to compose your first message.'}
                </p>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = selectedThread?.threadId === thread.threadId;
                const lastMsg = thread.messages[thread.messages.length - 1];

                return (
                  <button
                    key={thread.threadId}
                    type="button"
                    onClick={() => handleSelectThread(thread)}
                    className={`w-full p-3.5 text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/80 border-l-4 border-emerald-600 shadow-2xs'
                        : thread.hasUnreadReply
                          ? 'bg-rose-50/50 hover:bg-rose-50/80'
                          : 'hover:bg-white'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${
                        thread.hasUnreadReply
                          ? 'bg-rose-100 text-rose-700 font-black'
                          : isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                      }`}>
                        {thread.receiverName ? thread.receiverName.charAt(0).toUpperCase() : <Mail className="h-4 w-4" />}
                      </div>
                      {thread.hasUnreadReply && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 border-2 border-white rounded-full animate-pulse"></span>
                      )}
                    </div>

                    {/* Thread Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <p className={`text-xs font-bold truncate ${
                          thread.hasUnreadReply ? 'text-rose-950 font-black' : isSelected ? 'text-emerald-950 font-black' : 'text-slate-900'
                        }`}>
                          {thread.receiverEmail}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {safeFormat(thread.lastUpdated, 'HH:mm')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-slate-600 font-medium truncate">
                          {thread.receiverName || 'Recipient'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] font-mono text-emerald-700 font-bold shrink-0">
                          ${Number(thread.amount || 0).toLocaleString()}
                        </span>
                      </div>

                      {/* Last Message Snippet */}
                      <p className="text-[11px] text-slate-500 truncate mt-1">
                        {lastMsg ? (
                          <>
                            <span className="font-semibold text-slate-700">
                              {lastMsg.senderType === 'admin' ? 'You: ' : lastMsg.senderType === 'system' ? 'System: ' : 'Receiver: '}
                            </span>
                            {lastMsg.message}
                          </>
                        ) : (
                          <span className="italic text-slate-400">No messages yet</span>
                        )}
                      </p>

                      {/* Reference Badge & Unread Pill */}
                      <div className="flex items-center justify-between gap-1 mt-1.5 pt-1 border-t border-slate-100/60">
                        <span className="text-[10px] font-mono text-slate-400">
                          #{thread.referenceId}
                        </span>
                        {thread.hasUnreadReply && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white animate-pulse">
                            New Reply!
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: ACTIVE CHAT SPACE (RECEIVE & SEND)          */}
        {/* ========================================================= */}
        <div className={`flex-1 flex flex-col bg-white overflow-hidden ${!selectedThread ? 'hidden md:flex' : 'flex'}`}>
          {selectedThread ? (
            <>
              {/* Active Chat Header */}
              <div className="p-3 sm:p-4 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedThread(null)}
                    className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                    title="Back to list"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                    {selectedThread.receiverName ? selectedThread.receiverName.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-mono font-bold text-sm sm:text-base text-slate-900 break-all">
                        {selectedThread.receiverEmail}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        SendGrid Active
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                      <span className="font-semibold text-slate-700">{selectedThread.receiverName}</span>
                      {selectedThread.bankName && <span>• {selectedThread.bankName}</span>}
                      <span>• Ref: <strong className="font-mono text-slate-800">#{selectedThread.referenceId}</strong></span>
                      <span className="text-emerald-700 font-bold">(${Number(selectedThread.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedThread.currency})</span>
                    </div>
                  </div>
                </div>

                {/* Header Action Tools */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyReplyUrl(selectedThread)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Copy response portal URL for recipient"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                    <span className="hidden sm:inline">{copiedLink ? 'Copied Link!' : 'Copy Portal Link'}</span>
                  </button>

                  <a
                    href={`/reply/${selectedThread.threadId}?token=${selectedThread.replyToken}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    title="Open Receiver Response Portal in New Tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  <Link
                    to="/admin/transactions"
                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                    title="View Ledger"
                  >
                    <DollarSign className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Chat Messages Stream (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/70">
                {/* Notice Card: Two-Way SendGrid Architecture */}
                <div className="p-3 bg-white/90 border border-slate-200 rounded-2xl text-center max-w-lg mx-auto shadow-2xs space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>SendGrid Two-Way Direct Email Stream</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Emails sent from here arrive directly in <strong>{selectedThread.receiverEmail}</strong>'s real inbox with an authenticated one-click reply portal. Replies appear live below!
                  </p>
                </div>

                {/* Messages Loop */}
                {selectedThread.messages.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <MessageSquare className="h-10 w-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-600 text-sm">No messages in this email thread yet.</p>
                    <p className="text-xs">Type your message below to dispatch the first email to this recipient via SendGrid.</p>
                  </div>
                ) : (
                  selectedThread.messages.map((msg) => {
                    const isSystem = msg.senderType === 'system';
                    const isAdmin = msg.senderType === 'admin';

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center my-3">
                          <div className="bg-slate-200/80 text-slate-700 px-4 py-2 rounded-2xl text-xs max-w-md text-center border border-slate-300/60 shadow-2xs space-y-0.5">
                            <span className="font-bold text-slate-800 flex items-center justify-center gap-1 text-[11px] uppercase tracking-wider">
                              <Sparkles className="h-3 w-3 text-emerald-600" />
                              {msg.subject || 'Transfer Event'}
                            </span>
                            <p className="text-[11px] text-slate-600 leading-relaxed">{msg.message}</p>
                            <span className="text-[9px] text-slate-400 font-mono block">
                              {safeFormat(msg.timestamp, 'MMM dd, HH:mm')}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    if (isAdmin) {
                      // SENT MESSAGE (Admin -> Receiver)
                      return (
                        <div key={msg.id} className="flex justify-end">
                          <div className="max-w-[85%] sm:max-w-xl bg-slate-900 text-white rounded-3xl rounded-tr-xs p-4 sm:p-5 shadow-md shadow-slate-900/10 space-y-2">
                            {/* Header */}
                            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                <Send className="h-3 w-3 text-emerald-400" />
                                <span>Sent via SendGrid</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {safeFormat(msg.timestamp, 'MMM dd, HH:mm')}
                              </span>
                            </div>

                            {/* Subject */}
                            {msg.subject && (
                              <p className="text-xs font-bold text-slate-200">
                                {msg.subject}
                              </p>
                            )}

                            {/* Body */}
                            <p className="text-xs sm:text-sm text-slate-100 whitespace-pre-line leading-relaxed font-normal">
                              {msg.message}
                            </p>

                            {/* Footer Status */}
                            <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80">
                              <span>To: {selectedThread.receiverEmail}</span>
                              <span className="flex items-center gap-1 text-emerald-400 font-mono font-bold">
                                <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Delivered</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // RECEIVED MESSAGE (Receiver -> Admin)
                    return (
                      <div key={msg.id} className="flex justify-start">
                        <div className="max-w-[85%] sm:max-w-xl bg-white border border-slate-200 text-slate-900 rounded-3xl rounded-tl-xs p-4 sm:p-5 shadow-sm space-y-2">
                          {/* Header */}
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">
                                {msg.senderName ? msg.senderName.charAt(0).toUpperCase() : 'R'}
                              </div>
                              <span className="text-xs font-black text-slate-900">
                                {msg.senderName || selectedThread.receiverName || 'Recipient'}
                              </span>
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded border border-indigo-100">
                                Verified Reply
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {safeFormat(msg.timestamp, 'MMM dd, HH:mm')}
                            </span>
                          </div>

                          {/* Body */}
                          <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                            {msg.message}
                          </p>

                          {/* Footer */}
                          <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100">
                            <span>From: {msg.senderEmail || selectedThread.receiverEmail}</span>
                            <span className="text-slate-500 font-medium">Via Secure Portal</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Template Chips */}
              <div className="px-3 sm:px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-emerald-600" />
                  Quick:
                </span>
                {[
                  'Funds settlement confirmed. Your transfer is processing through central clearing.',
                  'Please confirm receiving bank account and routing details for final credit.',
                  'Transaction is pending regulatory verification audit. Please review debit advice note.',
                  'Clearance approved. Beneficiary account will receive credit in 1 business hour.'
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => insertQuickTemplate(chip)}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-lg border border-slate-200 shrink-0 font-medium transition-colors cursor-pointer"
                  >
                    {chip.slice(0, 32)}...
                  </button>
                ))}
              </div>

              {/* Chat Composer Bar */}
              <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t border-slate-200 space-y-2 shrink-0">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Subject:</span>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Email Subject line..."
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={`Type email message to send directly to ${selectedThread.receiverEmail} via SendGrid...`}
                      className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500 resize-none shadow-xs"
                    />

                    <button
                      type="submit"
                      disabled={isSending || !message.trim()}
                      className="px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Send via SendGrid</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                  <span>SendGrid Delivery from verified official bank account. Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">Ctrl+Enter</kbd> to send.</span>
                  <span className="text-emerald-600 font-bold hidden sm:inline">✓ Direct to Recipient Real Gmail</span>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Mail className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-slate-700">No Email Thread Selected</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Select an existing conversation on the left to read and send messages, or click "New Email Chat" to compose a message.
              </p>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(true)}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Start New Email Conversation</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: START NEW EMAIL CONVERSATION VIA SENDGRID          */}
      {/* ========================================================= */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">New Email Conversation</h3>
                  <p className="text-xs text-slate-400">Dispatched via SendGrid REST API to receiver's real Gmail</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewThread} className="p-5 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Receiver Email Address</label>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Required</span>
                </div>
                <input
                  type="email"
                  value={newReceiverEmail}
                  onChange={(e) => setNewReceiverEmail(e.target.value)}
                  placeholder="e.g. beneficiary@gmail.com"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Optional Transfer & Reference Metadata */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Transfer & Reference Details
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                    Optional (Not Required)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recipient Name</label>
                      <span className="text-[10px] text-slate-400 font-medium">Optional</span>
                    </div>
                    <input
                      type="text"
                      value={newReceiverName}
                      onChange={(e) => setNewReceiverName(e.target.value)}
                      placeholder="e.g. John Doe (Optional)"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Transfer Amount ($)</label>
                      <span className="text-[10px] text-slate-400 font-medium">Optional</span>
                    </div>
                    <input
                      type="number"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="e.g. 50000 (Optional)"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Reference ID</label>
                      <span className="text-[10px] text-slate-400 font-medium">Optional</span>
                    </div>
                    <input
                      type="text"
                      value={newRefId}
                      onChange={(e) => setNewRefId(e.target.value)}
                      placeholder="Auto-generated if blank (Optional)"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Destination Bank</label>
                      <span className="text-[10px] text-slate-400 font-medium">Optional</span>
                    </div>
                    <input
                      type="text"
                      value={newBankName}
                      onChange={(e) => setNewBankName(e.target.value)}
                      placeholder="e.g. Chase Bank (Optional)"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Subject Line</label>
                    <span className="text-[10px] text-slate-400 font-medium">Optional</span>
                  </div>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. Official Update regarding Transfer (Optional)"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Message Body</label>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Required</span>
                </div>
                <textarea
                  rows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your official message to this recipient..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 resize-none"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingThread}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isCreatingThread ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Start Conversation & Send</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailChatSpace;
