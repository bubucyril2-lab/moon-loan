import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download,
  Loader2,
  Calendar,
  User,
  Activity,
  Mail,
  Copy,
  Check,
  DollarSign,
  Send,
  X,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  Building,
  ArrowLeft,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { safeFormat } from '../../utils/date';
import { storageService } from '../../services/storage';
import { emailService } from '../../services/emailService';
import { ReceiverThread, ReceiverThreadMessage } from '../../types';
import toast from 'react-hot-toast';

interface EnrichedTransaction {
  id: string;
  account_id: string;
  account_number: string;
  full_name: string;
  sender_email: string;
  recipient_name?: string;
  recipient_email?: string;
  recipient_account?: string;
  bank_name?: string;
  fee?: number;
  fee_reason?: string;
  reference_id?: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

const AdminTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // SendGrid Receiver Conversation Desk State
  const [activeMsgTx, setActiveMsgTx] = useState<EnrichedTransaction | null>(null);
  const [receiverThreads, setReceiverThreads] = useState<ReceiverThread[]>([]);
  const [activeThread, setActiveThread] = useState<ReceiverThread | null>(null);
  const [receiverEmailInput, setReceiverEmailInput] = useState('');
  const [receiverNameInput, setReceiverNameInput] = useState('');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [isRefreshingDesk, setIsRefreshingDesk] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [lastSentResult, setLastSentResult] = useState<any>(null);

  const fetchThreads = async () => {
    try {
      const threads = await emailService.getReceiverThreads();
      setReceiverThreads(threads);
      if (activeMsgTx) {
        const found = threads.find(t => 
          t.referenceId === activeMsgTx.reference_id || 
          (activeMsgTx.recipient_email && t.receiverEmail.toLowerCase() === activeMsgTx.recipient_email.toLowerCase())
        );
        if (found) {
          setActiveThread(found);
        }
      }
    } catch (e) {
      console.warn('Error fetching threads:', e);
    }
  };

  const fetchAllTransactions = async () => {
    try {
      setIsLoading(true);
      const allTx = await storageService.getTransactions();
      const accounts = await storageService.getAccounts();
      const users = await storageService.getUsers();

      const enrichedTx: EnrichedTransaction[] = allTx.map(tx => {
        const account = accounts.find(a => a.id === tx.accountId);
        const user = account ? users.find(u => u.id === account.userId) : (tx.userId ? users.find(u => u.id === tx.userId) : null);
        
        return {
          id: tx.id,
          account_id: tx.accountId,
          account_number: account?.account_number || account?.accountNumber || 'N/A',
          full_name: user?.full_name || user?.fullName || 'Customer',
          sender_email: tx.senderEmail || user?.email || 'N/A',
          recipient_name: tx.recipientName,
          recipient_email: tx.recipientEmail || tx.recipient_email || '',
          recipient_account: tx.recipientAccount,
          bank_name: tx.bankName,
          fee: tx.fee,
          fee_reason: tx.feeReason,
          reference_id: tx.reference_id || tx.referenceId || tx.id,
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          status: tx.status,
          created_at: tx.created_at || tx.createdAt || ''
        };
      });

      setTransactions(enrichedTx.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      await fetchThreads();
    } catch (error) {
      console.error(error);
      toast.error('Failed to load transaction ledger');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTransactions();
    // Poll threads every 5 seconds so replies appear automatically
    const interval = setInterval(fetchThreads, 5000);
    return () => clearInterval(interval);
  }, [activeMsgTx?.reference_id]);

  const copyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    toast.success('Copied: ' + email);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyReplyUrl = (thread: ReceiverThread) => {
    const url = `${window.location.origin}/reply/${thread.threadId}?token=${thread.replyToken}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success('Recipient Reply Portal Link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const openMessageReceiverModal = async (tx: EnrichedTransaction) => {
    setActiveMsgTx(tx);
    const recEmail = tx.recipient_email || '';
    const recName = tx.recipient_name || 'Recipient';
    setReceiverEmailInput(recEmail);
    setReceiverNameInput(recName);
    setMsgSubject(`[ECONEST BANK] Inward Transfer Notice - Ref #${tx.reference_id}`);
    setMsgBody(
      `Dear ${recName},\n\n` +
      `We are writing to you regarding the electronic fund transfer of $${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD (Ref: #${tx.reference_id}) delivered to ${tx.bank_name || 'your destination account'}.\n\n` +
      `Originator: ${tx.sender_email} (${tx.full_name})\n\n` +
      `Please let us know if you require any official advice note or documentation regarding this settlement.\n\n` +
      `Best regards,\nECONEST BANK Administration`
    );
    setLastSentResult(null);

    // Look up or initialize existing thread
    const found = receiverThreads.find(t => 
      t.referenceId === tx.reference_id || 
      (recEmail && t.receiverEmail.toLowerCase() === recEmail.toLowerCase())
    );
    if (found) {
      setActiveThread(found);
      if (found.hasUnreadReply) {
        await emailService.markThreadRead(found.threadId);
        found.hasUnreadReply = false;
      }
    } else {
      setActiveThread(null);
    }
  };

  const handleSendReceiverEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverEmailInput || !receiverEmailInput.includes('@')) {
      toast.error('Please enter a valid receiver email address');
      return;
    }
    if (!msgBody.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSendingMsg(true);
    try {
      const res = await emailService.sendReceiverMessage({
        threadId: activeThread?.threadId,
        transactionId: activeMsgTx?.id,
        referenceId: activeMsgTx?.reference_id,
        receiverEmail: receiverEmailInput.trim(),
        receiverName: receiverNameInput.trim() || activeMsgTx?.recipient_name || 'Valued Recipient',
        senderName: activeMsgTx?.full_name || 'ECONEST Customer',
        senderEmail: activeMsgTx?.sender_email || '',
        amount: activeMsgTx?.amount,
        currency: 'USD',
        bankName: activeMsgTx?.bank_name || 'Beneficiary Bank',
        subject: msgSubject.trim(),
        message: msgBody.trim(),
        adminName: user?.fullName || user?.full_name || 'ECONEST Bank Administration'
      });

      setLastSentResult(res);
      if (res.success) {
        toast.success(res.simulated ? 'Message logged in system (SendGrid API key pending)' : `Email delivered via SendGrid to ${receiverEmailInput}!`);
        if (res.thread) {
          setActiveThread(res.thread);
        }
        setMsgBody('');
        fetchThreads();
      } else {
        toast.error('SendGrid error: ' + (res.error || 'Failed to dispatch email'));
      }

      if (user) {
        await storageService.saveAuditLog({
          id: Math.random().toString(36).substr(2, 9),
          adminId: user.id,
          adminName: user.fullName || user.full_name || 'Admin',
          action: 'sendgrid_message_receiver',
          details: `Admin dispatched SendGrid message to receiver: ${receiverEmailInput} for Ref #${activeMsgTx?.reference_id}`,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      toast.error('Failed to send email via SendGrid: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSendingMsg(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const q = search.toLowerCase();
    const matchesSearch = 
      tx.full_name.toLowerCase().includes(q) ||
      tx.sender_email.toLowerCase().includes(q) ||
      (tx.recipient_email && tx.recipient_email.toLowerCase().includes(q)) ||
      (tx.recipient_name && tx.recipient_name.toLowerCase().includes(q)) ||
      tx.account_number.includes(q) ||
      tx.description.toLowerCase().includes(q) ||
      (tx.reference_id && tx.reference_id.toLowerCase().includes(q)) ||
      (tx.fee_reason && tx.fee_reason.toLowerCase().includes(q));

    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">System Transactions</h2>
          <p className="text-slate-500 text-sm">Monitor all transfers and view sender emails, applied fees, and recipient routing</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by sender email, name, ref..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all w-full"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('debit')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${typeFilter === 'debit' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500'}`}
            >
              Debits / Transfers
            </button>
            <button
              onClick={() => setTypeFilter('credit')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${typeFilter === 'credit' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500'}`}
            >
              Credits
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Records Container: Mobile Cards (lg:hidden) & Desktop Table (hidden lg:block) */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        
        {/* Loading State */}
        {isLoading && (
          <div className="px-6 py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading ledger records...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredTransactions.length === 0 && (
          <div className="px-6 py-16 text-center text-slate-500">
            <Activity className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No matching transactions found.</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing filters or search terms.</p>
          </div>
        )}

        {/* 1. MOBILE & TABLET CARD VIEW (Visible on screens < 1024px - Zero Horizontal Scroll) */}
        {!isLoading && filteredTransactions.length > 0 && (
          <div className="divide-y divide-slate-100 lg:hidden">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="p-3.5 sm:p-5 space-y-3 hover:bg-slate-50/60 transition-colors min-w-0">
                {/* Card Header: Sender Info & Amount */}
                <div className="flex items-start justify-between gap-2.5 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs font-mono break-all">
                          {tx.sender_email}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyEmail(tx.sender_email, tx.id)}
                          className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer shrink-0"
                          title="Copy Sender Email"
                        >
                          {copiedId === tx.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium break-words">
                        {tx.full_name} • {tx.account_number}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-sm sm:text-base font-black font-mono ${
                      tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {tx.type === 'credit' ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 uppercase mt-0.5">
                      {tx.status}
                    </span>
                  </div>
                </div>

                {/* Card Body: Receiver, Fee, Ref ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 p-2.5 sm:p-3 rounded-2xl border border-slate-100 text-xs min-w-0">
                  {/* Receiver Info */}
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Beneficiary / Receiver</span>
                    <p className="font-bold text-slate-800 break-words">
                      {tx.recipient_name || 'Recipient'}
                      {tx.bank_name ? <span className="font-normal text-slate-500 text-[11px]"> ({tx.bank_name})</span> : null}
                    </p>
                    {tx.recipient_email ? (
                      <div className="flex items-center gap-1 mt-1 flex-wrap min-w-0">
                        <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1 break-all max-w-full">
                          <Mail className="h-3 w-3 text-indigo-500 shrink-0" />
                          <span className="break-all">{tx.recipient_email}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => copyEmail(tx.recipient_email!, tx.id + '-rec')}
                          className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer shrink-0"
                          title="Copy Receiver Email"
                        >
                          {copiedId === tx.id + '-rec' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No email captured</span>
                    )}
                  </div>

                  {/* Ref & Fee */}
                  <div className="space-y-1 min-w-0">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Ref ID & Date</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[11px] font-bold text-slate-700 break-all">{tx.reference_id}</span>
                        <span className="text-[10px] text-slate-400">• {safeFormat(tx.created_at, 'MMM dd, HH:mm')}</span>
                      </div>
                    </div>
                    <div>
                      {(tx.fee || 0) > 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 break-words leading-tight">
                          ${Number(tx.fee).toFixed(2)} Fee {tx.fee_reason ? `(${tx.fee_reason})` : ''}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          $0.00 (Zero Fee)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Memo */}
                {tx.description && (
                  <p className="text-[11px] text-slate-500 bg-white p-2 rounded-xl border border-slate-100 break-words leading-normal">
                    <span className="font-semibold text-slate-700">Memo:</span> {tx.description}
                  </p>
                )}

                {/* Action Button: 100% visible, inside card, no horizontal scroll */}
                <div className="pt-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => openMessageReceiverModal(tx)}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20 active:scale-95 cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4 text-indigo-200 shrink-0" />
                    <span>Message Receiver</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. DESKTOP TABLE VIEW (Visible only on lg screens >= 1024px) */}
        {!isLoading && filteredTransactions.length > 0 && (
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="px-5 py-4">Sender Email (Who Transferred)</th>
                  <th className="px-5 py-4">Receiver Email & Beneficiary</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Fee & Reason</th>
                  <th className="px-5 py-4">Reference ID</th>
                  <th className="px-5 py-4">Date & Status</th>
                  <th className="px-5 py-4 text-right">Receiver Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Sender Email Column */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 font-mono text-xs">{tx.sender_email}</span>
                            <button
                              type="button"
                              onClick={() => copyEmail(tx.sender_email, tx.id)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                              title="Copy Sender Email"
                            >
                              {copiedId === tx.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium">{tx.full_name} • {tx.account_number}</p>
                        </div>
                      </div>
                    </td>

                    {/* Receiver Email & Beneficiary Column */}
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {tx.recipient_email ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg text-xs font-mono flex items-center gap-1">
                              <Mail className="h-3 w-3 text-indigo-500" />
                              {tx.recipient_email}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyEmail(tx.recipient_email!, tx.id + '-rec')}
                              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                              title="Copy Receiver Email"
                            >
                              {copiedId === tx.id + '-rec' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No email captured</span>
                        )}

                        <div className="text-xs">
                          <span className="font-semibold text-slate-800">{tx.recipient_name || 'Recipient'}</span>
                          <span className="text-slate-400 text-[10px] ml-1.5">
                            {tx.bank_name ? `• ${tx.bank_name}` : ''} ({tx.recipient_account || 'N/A'})
                          </span>
                        </div>
                        {tx.description && (
                          <p className="text-[10px] text-slate-500 truncate max-w-[200px]" title={tx.description}>
                            Memo: {tx.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className={`text-sm font-black font-mono ${
                        tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                      }`}>
                        {tx.type === 'credit' ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </td>

                    {/* Fee and Reason */}
                    <td className="px-5 py-4">
                      {(tx.fee || 0) > 0 ? (
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            ${Number(tx.fee).toFixed(2)} Fee
                          </span>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[160px]" title={tx.fee_reason}>
                            {tx.fee_reason || 'Administrative Clearing'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase whitespace-nowrap">
                          $0.00 (Zero Fee)
                        </span>
                      )}
                    </td>

                    {/* Reference */}
                    <td className="px-5 py-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {tx.reference_id}
                    </td>

                    {/* Date & Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-[11px] text-slate-500 mb-1">
                        {safeFormat(tx.created_at, 'MMM dd, HH:mm')}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        {tx.status}
                      </span>
                    </td>

                    {/* Message Receiver Action Column */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      {(() => {
                        const thread = receiverThreads.find(t => 
                          t.referenceId === tx.reference_id || 
                          (tx.recipient_email && t.receiverEmail.toLowerCase() === tx.recipient_email.toLowerCase())
                        );
                        const msgCount = thread?.messages?.length || 0;
                        const hasUnread = thread?.hasUnreadReply;

                        return (
                          <div className="flex items-center justify-end gap-2">
                            {hasUnread && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse shadow-sm shadow-rose-600/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                New Reply!
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => openMessageReceiverModal(tx)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
                                hasUnread
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                                  : msgCount > 0
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                              }`}
                              title="Send message to receiver via SendGrid and view two-way conversation"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>{msgCount > 0 ? `Desk (${msgCount})` : 'Message Receiver'}</span>
                            </button>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* SENDGRID RECEIVER CONVERSATION DESK MODAL DIALOG */}
      {/* ============================================================== */}
      {activeMsgTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-5 sm:p-7 space-y-5 relative my-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-100">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      SendGrid Receiver Conversation Desk
                    </h3>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      Real-Time Sync
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Messages are delivered via SendGrid directly to the recipient's real Gmail. Replies from the recipient arrive here automatically.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveMsgTx(null)}
                  className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1 text-xs font-bold"
                  title="Return to Transactions List"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Close</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMsgTx(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  title="Close (X)"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Context Badge */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transaction Ref</p>
                <p className="font-mono font-bold text-slate-800 truncate">#{activeMsgTx.reference_id}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settled Amount</p>
                <p className="font-mono font-bold text-emerald-600">${Number(activeMsgTx.amount).toFixed(2)} USD</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Originating Sender</p>
                <p className="font-mono font-bold text-slate-700 truncate">{activeMsgTx.sender_email}</p>
              </div>
            </div>

            {/* Public Reply Portal Sharing Link */}
            {activeThread && (
              <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="space-y-0.5 min-w-0">
                  <p className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    <span>Recipient Direct Response Portal Link:</span>
                  </p>
                  <p className="font-mono text-[11px] text-indigo-800 truncate">
                    {window.location.origin}/reply/{activeThread.threadId}?token={activeThread.replyToken}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyReplyUrl(activeThread)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? 'Copied Link!' : 'Copy Portal Link'}</span>
                  </button>
                  <a
                    href={`/reply/${activeThread.threadId}?token=${activeThread.replyToken}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                    title="Open Response Portal in New Tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Message History Stream */}
            {activeThread && activeThread.messages.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Conversation Stream ({activeThread.messages.length} messages)
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Updates
                  </span>
                </div>
                <div className="max-h-52 overflow-y-auto space-y-3 p-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs">
                  {activeThread.messages.map((m) => {
                    const isAdmin = m.senderType === 'admin';
                    return (
                      <div
                        key={m.id}
                        className={`p-3 rounded-xl border ${
                          isAdmin 
                            ? 'bg-white border-slate-200 ml-4' 
                            : 'bg-emerald-50 border-emerald-200 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
                            <span className="font-bold text-slate-900">
                              {isAdmin ? 'Bank Administration (SendGrid)' : (m.senderName || 'Recipient')}
                            </span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                              isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {isAdmin ? 'Outgoing' : 'Incoming Reply'}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{m.message}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <form onSubmit={handleSendReceiverEmail} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Receiver Email Address (Recipient Gmail) *
                  </label>
                  <input
                    type="email"
                    required
                    value={receiverEmailInput}
                    onChange={(e) => setReceiverEmailInput(e.target.value)}
                    placeholder="receiver@gmail.com"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Receiver Display Name
                  </label>
                  <input
                    type="text"
                    value={receiverNameInput}
                    onChange={(e) => setReceiverNameInput(e.target.value)}
                    placeholder="Full Name"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Email Subject *
                </label>
                <input
                  type="text"
                  required
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Message Body to Receiver *
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Dispatched via SendGrid API to Real Gmail
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  placeholder="Type message to the receiver..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 resize-none font-sans leading-relaxed"
                />
              </div>

              {/* Status Banner if sent */}
              {lastSentResult && (
                <div className={`p-4 rounded-xl text-xs font-medium ${
                  lastSentResult.simulated 
                    ? 'bg-amber-50 text-amber-900 border border-amber-200' 
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">{lastSentResult.message || 'Email successfully processed via SendGrid'}</p>
                      {lastSentResult.messageId && (
                        <p className="text-[10px] font-mono text-emerald-700 mt-0.5">SendGrid Message ID: {lastSentResult.messageId}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <a
                  href={`mailto:${receiverEmailInput}?subject=${encodeURIComponent(msgSubject)}&body=${encodeURIComponent(msgBody)}`}
                  className="text-xs text-slate-600 hover:text-slate-900 hover:underline flex items-center gap-1 font-semibold"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open in Mail Client</span>
                </a>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setActiveMsgTx(null)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingMsg}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSendingMsg ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Sending via SendGrid...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send via SendGrid to Recipient</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
