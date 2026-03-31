import React, { useEffect, useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  TrendingUp,
  Clock,
  Send,
  Banknote,
  User as UserIcon,
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Account, Transaction } from '../../types';
import { safeFormat } from '../../utils/date';
import { storageService } from '../../services/storage';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Globe, MapPin, Calendar, Mail } from 'lucide-react';

import TradingChart from '../../components/TradingChart';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const acc = await storageService.getAccountByUserId(user.id);
        if (acc) {
          setAccount(acc);
          const txs = await storageService.getTransactionsByAccountId(acc.id, user.id);
          setTransactions(txs.sort((a, b) => new Date(b.createdAt || b.created_at || '').getTime() - new Date(a.createdAt || a.created_at || '').getTime()));
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('Failed to load account data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    
    // In a real app with local storage, we might want to listen for storage events
    // but for this demo, simple load is enough.
  }, [user]);

  if (isLoading) return <div className="animate-pulse space-y-8">
    <div className="h-32 bg-slate-200 rounded-2xl w-full"></div>
    <div className="grid md:grid-cols-3 gap-6">
      <div className="h-24 bg-slate-200 rounded-xl"></div>
      <div className="h-24 bg-slate-200 rounded-xl"></div>
      <div className="h-24 bg-slate-200 rounded-xl"></div>
    </div>
  </div>;

  return (
    <div className="space-y-8">
      {/* Profile Info */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
        <div className="w-24 h-24 bg-emerald-100 rounded-2xl border-4 border-white shadow-lg overflow-hidden flex-shrink-0">
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UserIcon className="h-10 w-10 text-emerald-600" />
            </div>
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-slate-900">{user?.fullName}</h2>
          <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 mt-3">
            <div className="flex items-center gap-1.5 text-slate-600 text-sm">
              <Globe className="h-4 w-4 text-emerald-600" />
              <span className="font-bold text-slate-900">Country:</span> {user?.country || 'Not provided'}
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 text-sm">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span className="font-bold text-slate-900">City:</span> {user?.city || 'Not provided'}
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 text-sm">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <span className="font-bold text-slate-900">Age:</span> {user?.age ? `${user.age} years old` : 'Not provided'}
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 text-sm">
              <Mail className="h-4 w-4 text-emerald-600" />
              <span className="font-bold text-slate-900">Email:</span> {user?.email || 'Not provided'}
            </div>
          </div>
        </div>
      </div>

      {/* Virtual Card & Balance */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative group">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/40 min-h-[320px] flex flex-col justify-between border border-white/10">
            {/* Card Header */}
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-emerald-500 font-black tracking-[0.2em] text-sm mb-1">ECONEST BANK</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Virtual Debit Card</p>
              </div>
              <div className="w-12 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg relative overflow-hidden shadow-inner">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)]"></div>
                <div className="grid grid-cols-2 gap-px h-full p-1 opacity-40">
                  <div className="border-r border-b border-black/20"></div>
                  <div className="border-b border-black/20"></div>
                  <div className="border-r border-black/20"></div>
                  <div></div>
                </div>
              </div>
            </div>

            {/* Card Number */}
            <div className="relative z-10 my-8">
              <p className="text-xs text-slate-500 uppercase tracking-[0.3em] font-bold mb-3 opacity-60">Card Number</p>
              <p className="font-mono text-3xl md:text-4xl tracking-[0.15em] text-slate-100 drop-shadow-lg">
                {account?.accountNumber.replace(/(\d{4})/g, '$1 ').trim()}
              </p>
            </div>

            {/* Card Footer */}
            <div className="relative z-10 flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold opacity-60">Card Holder</p>
                <p className="text-xl font-bold tracking-wide text-slate-200 uppercase">{user?.fullName}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold opacity-60 mb-1">Balance</p>
                <p className="text-3xl font-black text-emerald-400">
                  ${account?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <ShieldCheck className="h-48 w-48" />
            </div>
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)] pointer-events-none"></div>
          </div>
          
          {/* Card Hover Effect Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-[2.6rem] blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 pointer-events-none"></div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Link 
                to="/dashboard/transfers"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:border-blue-100 transition-all group"
              >
                <Send className="h-6 w-6 text-slate-600 group-hover:text-blue-600 mb-2" />
                <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600">Send Money</span>
              </Link>
              <Link 
                to="/dashboard/loans"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-amber-50 hover:border-amber-100 transition-all group"
              >
                <Banknote className="h-6 w-6 text-slate-600 group-hover:text-amber-600 mb-2" />
                <span className="text-xs font-bold text-slate-600 group-hover:text-amber-600">Apply Loan</span>
              </Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-2">Virtual Card Status</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-600">Active</span>
              <span className="text-xs font-mono text-slate-400">**** **** **** 4290</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            Recent Transactions
          </h3>
          <Link 
            to="/dashboard/history"
            className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            View All
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {transactions.slice(0, 5).map((tx) => (
            <div key={tx.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  tx.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                }`}>
                  {tx.type === 'credit' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <p className={`text-sm font-bold ${
                  tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                }`}>
                  {tx.type === 'credit' ? '+' : '-'}${tx.amount.toLocaleString()}
                </p>
              </div>
              <p className="text-sm font-bold text-slate-900 truncate mb-1">{tx.description}</p>
              <p className="text-xs text-slate-500">{safeFormat(tx.createdAt || tx.created_at, 'MMM dd, HH:mm')}</p>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-500 text-sm">
              No recent transactions found.
            </div>
          )}
        </div>
      </div>

      {/* Market Trading */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            Live Market Trading
          </h3>
        </div>
        <div className="h-[400px] w-full overflow-hidden rounded-2xl">
          <TradingChart />
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
