import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Activity, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Megaphone, 
  Send, 
  Loader2, 
  ArrowRight, 
  ArrowRightLeft, 
  Banknote, 
  MessageSquare, 
  ShieldAlert, 
  Shield, 
  Mail, 
  Copy, 
  Check, 
  Sliders, 
  Power, 
  FileText,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { safeFormat } from '../../utils/date';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'motion/react';
import { storageService, AuditLog } from '../../services/storage';
import { emailService } from '../../services/emailService';
import { Transaction, User, FeeReason, SmtpConfig, EmailLog } from '../../types';
import { DEFAULT_FEE_REASONS } from '../../services/bankConfig';

interface AdminStats {
  totalCustomers: number;
  pendingApprovals: number;
  activeAccounts: number;
  totalSystemBalance: number;
  activeLoans: number;
  pendingLoans: number;
  totalDisbursed: number;
  totalRepayments: number;
  totalTransfersCount: number;
  totalTransferVolume: number;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [recentTransfers, setRecentTransfers] = useState<Transaction[]>([]);
  const [customersMap, setCustomersMap] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Settings status
  const [feeEnabled, setFeeEnabled] = useState(true);
  const [feeReasons, setFeeReasons] = useState<FeeReason[]>(DEFAULT_FEE_REASONS);
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig | null>(null);
  const [recentEmails, setRecentEmails] = useState<EmailLog[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [users, accounts, logs, loans, transactions, settings, smtp, emails] = await Promise.all([
          storageService.getUsers(),
          storageService.getAccounts(),
          storageService.getAuditLogs(),
          storageService.getLoans(),
          storageService.getTransactions(),
          storageService.getSettings(),
          emailService.getSmtpConfig(),
          emailService.getEmailLogs()
        ]);

        const customers = users.filter(u => u.role === 'customer');
        const pending = customers.filter(u => u.status === 'pending').length;
        const active = accounts.filter(a => a.status === 'active').length;
        const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

        // Map users by id for quick lookup
        const uMap: Record<string, User> = {};
        users.forEach(u => {
          uMap[u.id] = u;
        });
        setCustomersMap(uMap);

        // Loan stats
        const activeLoans = loans.filter(l => l.status === 'approved' || l.status === 'repaying');
        const pendingLoans = loans.filter(l => l.status === 'pending');
        const totalDisbursed = activeLoans.reduce((sum, l) => sum + l.amount, 0);
        const totalRepayments = loans.filter(l => l.status === 'completed').reduce((sum, l) => sum + l.amount, 0);

        // Filter transfers and sort by date descending
        const transfers = transactions.sort((a, b) => 
          new Date(b.createdAt || b.created_at || '').getTime() - new Date(a.createdAt || a.created_at || '').getTime()
        );
        const totalVolume = transfers.reduce((sum, t) => sum + (t.amount || 0), 0);

        setRecentTransfers(transfers.slice(0, 10));

        setStats({
          totalCustomers: customers.length,
          pendingApprovals: pending,
          activeAccounts: active,
          totalSystemBalance: totalBalance,
          activeLoans: activeLoans.length,
          pendingLoans: pendingLoans.length,
          totalDisbursed,
          totalRepayments,
          totalTransfersCount: transfers.length,
          totalTransferVolume: totalVolume
        });

        // Parse Settings
        if (settings) {
          if (settings.fee_enabled !== undefined) setFeeEnabled(Boolean(settings.fee_enabled));
          if (settings.fee_reasons) {
            try {
              const parsed = typeof settings.fee_reasons === 'string' ? JSON.parse(settings.fee_reasons) : settings.fee_reasons;
              if (Array.isArray(parsed) && parsed.length > 0) setFeeReasons(parsed);
            } catch (e) {}
          }
        }

        if (smtp) setSmtpConfig(smtp);
        setRecentEmails(emails || []);

        // Financial 7 days growth curve
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          const dateStr = date.toISOString().split('T')[0];
          const dayTotal = transactions
            .filter(t => (t.createdAt || t.created_at || '').startsWith(dateStr))
            .reduce((sum, t) => sum + (t.type === 'credit' ? t.amount : -t.amount), totalBalance);
          return { date: format(date, 'MMM dd'), total: Math.max(0, dayTotal) };
        });
        setGrowthData(last7Days);
        setAuditLogs(logs);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim() || !user) return;
    setIsBroadcasting(true);
    try {
      const users = await storageService.getUsers();
      const notificationPromises = users.map(u => 
        storageService.saveNotification({
          id: Math.random().toString(36).substr(2, 9),
          userId: u.id,
          title: 'System Announcement',
          message: broadcastMessage,
          type: 'info',
          read: false,
          isRead: false,
          createdAt: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
      );
      await Promise.all(notificationPromises);

      await storageService.saveAuditLog({
        id: Math.random().toString(36).substr(2, 9),
        adminId: user.id,
        adminName: user.fullName || user.full_name || 'Admin',
        action: 'broadcast_message',
        details: broadcastMessage,
        createdAt: new Date().toISOString()
      });

      toast.success('Broadcast sent to all customer dashboards');
      setBroadcastMessage('');
    } catch (error) {
      toast.error('Failed to send broadcast');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied: ' + text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Executive Portal Data...</p>
      </div>
    );
  }

  const primaryStats = [
    { 
      label: 'Total System Liquidity', 
      value: `$${(stats?.totalSystemBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 
      icon: DollarSign, 
      color: 'from-emerald-600 to-teal-700',
      badge: 'Active Reserves',
      badgeColor: 'bg-emerald-500/20 text-emerald-100'
    },
    { 
      label: 'Registered Customers', 
      value: stats?.totalCustomers || 0, 
      icon: Users, 
      color: 'from-slate-900 to-slate-800',
      badge: `${stats?.pendingApprovals || 0} Pending`,
      badgeColor: 'bg-amber-500/20 text-amber-300'
    },
    { 
      label: 'All-Time Transfers', 
      value: `$${(stats?.totalTransferVolume || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}`, 
      icon: ArrowRightLeft, 
      color: 'from-indigo-600 to-indigo-800',
      badge: `${stats?.totalTransfersCount || 0} Txns`,
      badgeColor: 'bg-indigo-400/20 text-indigo-100'
    },
    { 
      label: 'SendGrid Email Delivery', 
      value: smtpConfig?.enabled ? 'CONNECTED' : 'STANDBY', 
      icon: Mail, 
      color: smtpConfig?.enabled ? 'from-emerald-700 to-emerald-900' : 'from-slate-700 to-slate-900',
      badge: smtpConfig?.adminAlertEmail ? `${smtpConfig.adminAlertEmail.split('@')[0]}@` : 'Not Set',
      badgeColor: 'bg-white/20 text-white'
    },
  ];

  const activeFeeReasonsCount = feeReasons.filter(r => r.isEnabled).length;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">
              ECONEST Real-Time Financial Core
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Executive Bank Operations</h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
            Live transfer tracking with sender email verification, dynamic transfer fee reasons, and automated SendGrid notifications.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/settings"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-900/30"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Manage Fees & SendGrid</span>
          </Link>
          <Link
            to="/admin/transactions"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700"
          >
            <span>All Transactions</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Mobile App Section Quick Jump Bar */}
      <div className="lg:hidden space-y-2.5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Link
            to="/admin/transactions"
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-sm whitespace-nowrap active:bg-indigo-700"
          >
            <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-200" />
            <span>Transfers & Messages</span>
          </Link>

          <Link
            to="/admin/customers"
            className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-black text-slate-800 shadow-2xs whitespace-nowrap active:bg-slate-100"
          >
            <Users className="h-3.5 w-3.5 text-blue-600" />
            <span>Customers ({stats?.totalCustomers || 0})</span>
          </Link>

          <Link
            to="/admin/transactions"
            className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-black text-slate-800 shadow-2xs whitespace-nowrap active:bg-slate-100"
          >
            <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-600" />
            <span>Transfers</span>
          </Link>

          <Link
            to="/admin/chat"
            className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-black text-slate-800 shadow-2xs whitespace-nowrap active:bg-slate-100"
          >
            <MessageSquare className="h-3.5 w-3.5 text-amber-600" />
            <span>Live Chat</span>
          </Link>

          <Link
            to="/admin/settings"
            className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-black text-slate-800 shadow-2xs whitespace-nowrap active:bg-slate-100"
          >
            <Sliders className="h-3.5 w-3.5 text-slate-600" />
            <span>SendGrid Settings</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metric Cards (2 columns on mobile for compact app feel) */}
      {/* Primary KPI Metric Cards (2 columns on mobile for compact app feel) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 min-w-0">
        {primaryStats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl text-white shadow-lg bg-gradient-to-br ${stat.color} relative overflow-hidden flex flex-col justify-between min-w-0`}
          >
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-bold text-white/80 uppercase tracking-wider truncate">{stat.label}</p>
                <h3 className="text-lg sm:text-2xl lg:text-3xl font-black mt-1.5 sm:mt-2 tracking-tight truncate" title={String(stat.value)}>{stat.value}</h3>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>

            <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-white/10 flex items-center justify-between min-w-0 gap-1">
              <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full truncate ${stat.badgeColor}`}>
                {stat.badge}
              </span>
              <span className="text-[9px] sm:text-[10px] text-white/60 font-mono shrink-0">Live Sync</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ============================================================== */}
      {/* HIGHLIGHTED SECTION: RECENT TRANSFERS & SENDER EMAILS */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ArrowRightLeft className="h-4 w-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Recent Transfers & Sender Emails</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 break-words">
              Admin audit showing the exact customer email address that executed each transfer, fee reason debited, and beneficiary.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium">
              Fees: <strong className={feeEnabled ? 'text-emerald-600' : 'text-slate-500'}>{feeEnabled ? 'ON' : 'OFF'}</strong>
            </span>
            <Link
              to="/admin/transactions"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>Full Ledger</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {recentTransfers.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 min-w-0">
            <ArrowRightLeft className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No transfers recorded yet</p>
            <p className="text-xs text-slate-400 mt-0.5">Customer transfers will display here with sender email and fee reasons.</p>
          </div>
        ) : (
          <div className="min-w-0">
            {/* 1. Mobile & Tablet Card View (< 1280px, Zero Horizontal Scroll) */}
            <div className="divide-y divide-slate-100 xl:hidden min-w-0">
              {recentTransfers.map((tx) => {
                const senderUser = tx.userId ? customersMap[tx.userId] : null;
                const displayEmail = tx.senderEmail || senderUser?.email || 'customer@econestbank.com';
                const senderName = senderUser?.fullName || senderUser?.full_name || 'Customer';

                return (
                  <div key={tx.id} className="py-3 sm:py-4 space-y-2.5 hover:bg-slate-50/60 transition-colors min-w-0">
                    <div className="flex items-start justify-between gap-2.5 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {senderName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 text-xs font-mono break-all">{displayEmail}</p>
                          <p className="text-[11px] text-slate-500 font-medium break-words">{senderName}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-slate-900 font-mono text-sm">
                          ${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {safeFormat(tx.createdAt || tx.created_at, 'MMM dd, HH:mm')}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs min-w-0">
                      <div className="min-w-0">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Recipient</span>
                        <p className="font-bold text-slate-800 text-[11px] break-words">{tx.recipientName || 'External Recipient'}</p>
                        <p className="text-[10px] text-slate-400 font-mono break-all">{tx.recipientAccount || tx.description}</p>
                      </div>
                      <div className="text-right min-w-0">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Fee / Reason</span>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          (tx.fee || 0) > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          ${Number(tx.fee || 0).toFixed(2)}
                        </span>
                        <p className="text-[9px] text-slate-500 break-words mt-0.5">{tx.feeReason || 'Clearing'}</p>
                      </div>
                    </div>

                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2 min-w-0">
                      <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded break-all max-w-full">
                        {tx.recipientEmail || (tx as any).recipient_email || 'No email'}
                      </span>
                      <Link
                        to="/admin/transactions"
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1 shrink-0"
                      >
                        <Mail className="h-3 w-3 text-indigo-200" />
                        <span>Message Receiver</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. Desktop Table View (>= 1280px) */}
            <div className="hidden xl:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 rounded-l-xl">Sender Email (Who Made Transfer)</th>
                    <th className="py-3 px-4">Recipient & Institution</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Fee & Reason</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4 rounded-r-xl text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTransfers.map((tx) => {
                    const senderUser = tx.userId ? customersMap[tx.userId] : null;
                    const displayEmail = tx.senderEmail || senderUser?.email || 'customer@econestbank.com';
                    const senderName = senderUser?.fullName || senderUser?.full_name || 'Customer';

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Sender Email Column */}
                        <td className="py-3.5 px-4 font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {senderName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 font-mono text-xs">{displayEmail}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(displayEmail, tx.id)}
                                  className="text-slate-400 hover:text-slate-700 p-0.5"
                                  title="Copy Email"
                                >
                                  {copiedId === tx.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                </button>
                              </div>
                              <p className="text-[10px] text-slate-500">{senderName}</p>
                            </div>
                          </div>
                        </td>

                        {/* Recipient Column */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800">{tx.recipientName || 'External Recipient'}</p>
                          {(tx.recipientEmail || (tx as any).recipient_email) && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                                <Mail className="h-2.5 w-2.5 text-indigo-500" />
                                {tx.recipientEmail || (tx as any).recipient_email}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(tx.recipientEmail || (tx as any).recipient_email, tx.id + '-rec')}
                                className="text-slate-400 hover:text-slate-600 p-0.5"
                                title="Copy Receiver Email"
                              >
                                {copiedId === tx.id + '-rec' ? <Check className="h-2.5 w-2.5 text-emerald-600" /> : <Copy className="h-2.5 w-2.5" />}
                              </button>
                              <Link
                                to="/admin/transactions"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors ml-1"
                                title="Message Receiver in Transactions"
                              >
                                Message Receiver
                              </Link>
                            </div>
                          )}
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{tx.recipientAccount || tx.description}</p>
                        </td>

                        {/* Amount Column */}
                        <td className="py-3.5 px-4 font-black text-slate-900 font-mono">
                          ${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        {/* Fee and Reason Column */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            (tx.fee || 0) > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            ${Number(tx.fee || 0).toFixed(2)}
                          </span>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[160px]" title={tx.feeReason || 'Standard Clearing'}>
                            {tx.feeReason || 'Standard Clearing'}
                          </p>
                        </td>

                        {/* Reference ID Column */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          {tx.reference_id || tx.referenceId || tx.id}
                        </td>

                        {/* Timestamp Column */}
                        <td className="py-3.5 px-4 text-right text-[11px] text-slate-400">
                          {safeFormat(tx.createdAt || tx.created_at, 'MMM dd, HH:mm')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Administrative Operations 3-Column Grid */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        {/* Card 1: Fee Reasons Status */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 min-w-0">
              <DollarSign className="h-5 w-5 text-amber-500 shrink-0" />
              <h4 className="font-bold text-slate-900 text-sm">Transfer Fees & Reasons</h4>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
              feeEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {feeEnabled ? 'ENABLED (ON)' : 'PAUSED (OFF)'}
            </span>
          </div>

          <div className="space-y-2 min-w-0">
            <p className="text-xs text-slate-500 leading-relaxed break-words">
              Active surcharge reasons are automatically applied to outgoing customer wires and visible on debit advice notes.
            </p>
            <div className="divide-y divide-slate-100 pt-1">
              {feeReasons.slice(0, 3).map((reason) => (
                <div key={reason.id} className="py-2.5 flex items-start justify-between gap-3 text-xs min-w-0">
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-slate-800 block text-xs break-words">{reason.name}</span>
                    <p className="text-[11px] text-slate-500 leading-normal mt-0.5 break-words">{reason.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    <span className="font-mono font-bold text-slate-900">${reason.amount.toFixed(2)}</span>
                    <span className={`w-2 h-2 rounded-full ${reason.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/admin/settings"
            className="block text-center py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-colors border border-slate-200"
          >
            Configure Fee Reasons (ON/OFF)
          </Link>
        </div>

        {/* Card 2: SendGrid Delivery Status */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="h-5 w-5 text-emerald-600 shrink-0" />
              <h4 className="font-bold text-slate-900 text-sm">SendGrid Email Delivery</h4>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${
              smtpConfig?.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {smtpConfig?.enabled ? 'ACTIVE' : 'OFF'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs min-w-0">
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 min-w-0">
              <p className="text-[10px] uppercase font-bold text-emerald-800">Two-Way Email Chat Space:</p>
              <p className="font-bold text-emerald-950 mt-0.5">
                Live Messaging Desk Connected
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Real-time SendGrid email dispatch & 2-way recipient responses.
              </p>
            </div>

            <div className="flex items-center justify-between text-slate-600 py-1 gap-2">
              <span className="shrink-0">Delivery Engine:</span>
              <span className="font-mono font-bold text-slate-900 truncate">SendGrid REST API v3</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 py-1 gap-2">
              <span className="shrink-0">Two-Way Receiver Desk:</span>
              <span className="font-bold text-emerald-600 shrink-0">Online & Ready</span>
            </div>
          </div>

          <div className="space-y-2">
            <Link
              to="/admin/email-chat"
              className="block text-center py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20"
            >
              Open Email Chat Space
            </Link>
            <Link
              to="/admin/settings"
              className="block text-center py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition-colors border border-slate-200"
            >
              Manage SendGrid API Settings
            </Link>
          </div>
        </div>

        {/* Card 3: Broadcast Quick Announcement */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 min-w-0">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 min-w-0">
            <Megaphone className="h-5 w-5 text-emerald-600 shrink-0" />
            <h4 className="font-bold text-slate-900 text-sm truncate">Instant Customer Broadcast</h4>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-3 min-w-0">
            <textarea
              rows={3}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Type urgent notice or promo sent to all customer dashboards..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 resize-none max-w-full"
            />
            <button
              type="submit"
              disabled={isBroadcasting || !broadcastMessage.trim()}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isBroadcasting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Broadcasting...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Broadcast to All</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Financial Growth Visualization Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 lg:p-8 space-y-4 min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <TrendingUp className="h-5 w-5 text-emerald-600 shrink-0" />
            <h3 className="font-bold text-slate-900 text-base truncate">7-Day Net Liquidity Flow</h3>
          </div>
          <span className="text-xs font-bold text-emerald-600 shrink-0">Calculated From Ledger</span>
        </div>

        <div className="h-64 sm:h-72 w-full pt-4 min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Balance']}
                contentStyle={{borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
              />
              <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
