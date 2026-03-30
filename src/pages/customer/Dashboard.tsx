import React, { useEffect, useState } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Plus,
  TrendingUp,
  Clock,
  X,
  Loader2,
  ArrowRight,
  Send,
  Banknote,
  Lock,
  User as UserIcon,
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Account, Transaction } from '../../types';
import { safeFormat } from '../../utils/date';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { storageService } from '../../services/storage';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Globe, MapPin, Calendar } from 'lucide-react';

import TradingChart from '../../components/TradingChart';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState<'deposit' | 'withdraw' | null>(null);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !user) return;
    
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (showModal === 'withdraw' && val > account.balance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsSubmitting(true);
    try {
      const newBalance = showModal === 'deposit' 
        ? account.balance + val 
        : account.balance - val;

      const updatedAccount = { ...account, balance: newBalance };
      await storageService.saveAccount(updatedAccount);
      setAccount(updatedAccount);

      const newTransaction: Transaction = {
        id: Math.random().toString(36).substring(2, 15),
        accountId: account.id,
        userId: user.id,
        type: showModal === 'deposit' ? 'credit' : 'debit',
        amount: val,
        description: `${showModal === 'deposit' ? 'Deposit' : 'Withdrawal'} to account`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      await storageService.saveTransaction(newTransaction);
      setTransactions([newTransaction, ...transactions]);

      toast.success(`${showModal === 'deposit' ? 'DEPOSIT' : 'WITHDRAWAL'} SUCCESSFUL`);
      setShowModal(null);
      setAmount('');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-slate-500 text-sm">
              <Globe className="h-4 w-4" />
              {user?.country || 'N/A'}
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-sm">
              <MapPin className="h-4 w-4" />
              {user?.city || 'N/A'}
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-sm">
              <Calendar className="h-4 w-4" />
              {user?.age || 'N/A'} years old
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/settings?tab=Profile" className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Welcome & Balance */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
          <div className="relative z-10">
            <p className="text-slate-400 font-medium mb-2">Available Balance</p>
            <h2 className="text-5xl font-bold mb-8">${account?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Account Number</p>
                <p className="font-mono text-lg tracking-widest">{account?.accountNumber.replace(/(\d{4})/g, '$1 ')}</p>
              </div>
              <div className="h-10 w-px bg-slate-700"></div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Account Type</p>
                <p className="font-bold">ECONEST Premium</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <Wallet className="h-32 w-32" />
          </div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/20 blur-3xl rounded-full"></div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowModal('deposit')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-emerald-50 hover:border-emerald-100 transition-all group"
              >
                <Plus className="h-6 w-6 text-slate-600 group-hover:text-emerald-600 mb-2" />
                <span className="text-xs font-bold text-slate-600 group-hover:text-emerald-600">Deposit</span>
              </button>
              <button 
                onClick={() => setShowModal('withdraw')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-red-50 hover:border-red-100 transition-all group"
              >
                <ArrowUpRight className="h-6 w-6 text-slate-600 group-hover:text-red-600 mb-2" />
                <span className="text-xs font-bold text-slate-600 group-hover:text-red-600">Withdraw</span>
              </button>
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

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div 
            className="absolute inset-0" 
            onClick={() => setShowModal(null)}
          />
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden">
            <button 
              onClick={() => setShowModal(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all z-20"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-8 max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-slate-900 mb-2 capitalize">{showModal} Funds</h3>
              <p className="text-sm text-slate-500 mb-8">Enter the amount you wish to {showModal}.</p>
              
              <form onSubmit={handleAction} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Amount ($)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-lg"
                    autoFocus
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                    showModal === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                      Confirm {showModal}
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
