import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { emailService } from '../../services/emailService';
import { ReceiverThread } from '../../types';
import { 
  Building2, 
  ShieldCheck, 
  Send, 
  CheckCircle2, 
  ArrowLeft, 
  Clock, 
  Mail, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Lock,
  User,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ReceiverReply: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [thread, setThread] = useState<ReceiverThread | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [senderName, setSenderName] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchThreadData = async (silent = false) => {
    if (!threadId) return;
    if (!silent) setIsLoading(true);
    try {
      const data = await emailService.getReceiverThread(threadId);
      if (data) {
        setThread(data);
        if (!senderName && data.receiverName) {
          setSenderName(data.receiverName);
        }
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('Failed to load thread:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThreadData();
  }, [threadId]);

  // Polling every 5 seconds to receive new messages in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      fetchThreadData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [threadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages]);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !threadId) {
      toast.error('Please enter a response message.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await emailService.sendReceiverReply({
        threadId,
        token,
        message: replyText.trim(),
        senderName: senderName.trim() || thread?.receiverName || 'Recipient',
        senderEmail: thread?.receiverEmail
      });

      if (res.success) {
        toast.success('Your reply has been sent directly to Bank Administration!');
        setReplyText('');
        setHasSubmitted(true);
        if (res.thread) {
          setThread(res.thread);
        } else {
          fetchThreadData(true);
        }
      } else {
        toast.error(res.error || 'Failed to submit response.');
      }
    } catch (err: any) {
      toast.error('Error sending reply: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-850 to-slate-950 text-slate-100 flex flex-col">
      {/* Top Banking Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">ECONEST BANK</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold uppercase">
                  Verified Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Official Direct Response Channel</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Lock className="h-3.5 w-3.5 text-emerald-400" />
              <span>TLS 256-bit Encrypted</span>
            </span>
            <Link
              to="/"
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all border border-slate-700"
            >
              Portal Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {isLoading ? (
          <div className="p-12 text-center space-y-4 bg-slate-900/50 rounded-3xl border border-slate-800">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mx-auto" />
            <p className="text-sm text-slate-400 font-medium">Connecting to ECONEST Secure Communication Channel...</p>
          </div>
        ) : !thread ? (
          <div className="p-10 text-center space-y-4 bg-slate-900/60 rounded-3xl border border-slate-800 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Conversation Not Found</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              This communication link may have expired or the reference ID is invalid. If you received this link in your email, please check the URL or contact bank support.
            </p>
            <Link
              to="/"
              className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
            >
              Return to ECONEST Home
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Transaction Overview Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                      Active Transaction Context
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                    Transfer Ref #{thread.referenceId}
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Beneficiary Communication Desk for <span className="text-white font-semibold">{thread.receiverEmail}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right sm:text-right bg-slate-950/60 p-3 sm:px-4 sm:py-2.5 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Settlement Amount</p>
                    <p className="text-lg sm:text-xl font-mono font-black text-emerald-400">
                      ${Number(thread.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {thread.currency}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchThreadData(false)}
                    title="Refresh conversation"
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Transaction Key Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
                <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Sender</span>
                  <span className="font-bold text-slate-200 truncate block mt-0.5">{thread.senderName || 'ECONEST Client'}</span>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Recipient Name</span>
                  <span className="font-bold text-slate-200 truncate block mt-0.5">{thread.receiverName || 'Transfer Beneficiary'}</span>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Routing Bank</span>
                  <span className="font-bold text-slate-200 truncate block mt-0.5">{thread.bankName || 'Beneficiary Bank'}</span>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Security Status</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>SendGrid Verified</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Conversation Stream */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
                    Official Message History ({thread.messages.length})
                  </h2>
                </div>
                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3" />
                  <span>Sync: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </span>
              </div>

              {thread.messages.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Mail className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-slate-400">No previous messages in this conversation yet.</p>
                  <p className="text-[11px] text-slate-500">You can type a message below to write directly to the Bank Administration.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                  {thread.messages.map((msg) => {
                    const isAdmin = msg.senderType === 'admin';
                    return (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isAdmin
                            ? 'bg-slate-850/90 border-slate-700/80 mr-4 sm:mr-8'
                            : 'bg-emerald-950/30 border-emerald-800/40 ml-4 sm:ml-8'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/60">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-indigo-400' : 'bg-emerald-400'}`}></span>
                            <span className="text-xs font-black text-white">
                              {isAdmin ? 'ECONEST Bank Administration' : (msg.senderName || 'Transfer Recipient')}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              isAdmin ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {isAdmin ? 'Bank Official' : 'Your Response'}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(msg.timestamp).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {msg.subject && msg.subject !== thread.referenceId && (
                          <p className="text-xs font-bold text-slate-300 mb-1.5">{msg.subject}</p>
                        )}

                        <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                          {msg.message}
                        </div>

                        {msg.deliveredVia && (
                          <div className="mt-2.5 pt-2 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>Channel: {msg.deliveredVia}</span>
                            <span>Delivered</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Compose Response Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Send className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Direct Response to Bank Administration Desk
                </h3>
              </div>

              {hasSubmitted && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-emerald-300">Response Recorded Successfully</p>
                    <p className="text-slate-300">
                      The bank administration has received your message in real-time. Any follow-up will be sent to your email ({thread.receiverEmail}) and displayed here.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmitReply} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="e.g. Recipient Full Name"
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Receiver Email (Verified Destination)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={thread.receiverEmail}
                      className="w-full p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-slate-400 font-mono cursor-not-allowed text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <label className="font-bold text-slate-400 uppercase tracking-wider">
                      Your Message / Inquiry / Confirmation *
                    </label>
                    <span className="text-slate-500 font-mono">{replyText.length} characters</span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Enter your message directly to the ECONEST Bank Administration team..."
                    className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Messages submitted here are delivered in real time to the bank administration console and logged for compliance.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting || !replyText.trim()}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send Reply to Bank Administration</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 space-y-1">
          <p>&copy; 2026 ECONEST BANK. Regulated Financial Institution. All rights reserved.</p>
          <p className="text-[10px] text-slate-600">SendGrid Secure Banking Delivery Service &bull; End-to-End Cryptographic Audit Logging</p>
        </div>
      </footer>
    </div>
  );
};

export default ReceiverReply;
