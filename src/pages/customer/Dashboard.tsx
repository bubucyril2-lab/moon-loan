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
  History
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Account, Transaction } from '../../types';
import { format } from 'date-fns';
import { safeFormat } from '../../utils/date';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Globe, MapPin, Calendar, User as UserIcon } from 'lucide-react';

const CustomerDashboard = () => {
  const { token, user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState<'deposit' | 'withdraw' | null>(null);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [accRes, transRes] = await Promise.all([
        fetch('/api/customer/account', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/customer/transactions', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const accData = await accRes.json();
      const transData = await transRes.json();

      setAccount(accData);
      setTransactions(transData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/customer/${showModal}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ amount: parseFloat(amount) })
      });

      if (res.ok) {
        toast.success(`${showModal === 'deposit' ? 'Deposit' : 'Withdrawal'} successful!`);
        setShowModal(null);
        setAmount('');
        fetchData();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Action failed');
      }
    } catch (error: any) {
      toast.error(error.message);
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
          <Link to="/dashboard/settings" className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">
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
                <p className="font-mono text-lg tracking-widest">{account?.account_number.replace(/(\d{4})/g, '$1 ')}</p>
              </div>
              <div className="h-10 w-px bg-slate-700"></div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Account Type</p>
                <p className="font-bold">Savings Premium</p>
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

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div 
            className="absolute inset-0" 
            onClick={() => setShowModal(null)}
          />
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative z-10">
            <button 
              onClick={() => setShowModal(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X className="h-5 w-5" />
            </button>
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
      )}

      {/* Stats & Activity */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Spending Analysis
            </h3>
            <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-xs font-bold text-slate-600">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={transactions.slice(0, 7).reverse()}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="created_at" hide />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="amount" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            Recent Activity
          </h3>
          <div className="space-y-6">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {tx.type === 'credit' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{tx.description}</p>
                    <p className="text-xs text-slate-500">{safeFormat(tx.created_at, 'MMM dd, HH:mm')}</p>
                  </div>
                </div>
                <p className={`text-sm font-bold ${
                  tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                }`}>
                  {tx.type === 'credit' ? '+' : '-'}${tx.amount.toLocaleString()}
                </p>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-center text-slate-500 text-sm py-8">No recent transactions</p>
            )}
          </div>
          <button className="w-full mt-8 py-3 text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors border-t border-slate-100">
            View All Transactions
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
