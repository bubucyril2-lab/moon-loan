import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download,
  Loader2,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Transaction } from '../../types';
import { format, isWithinInterval, startOfDay, endOfDay, subDays } from 'date-fns';
import { safeDate, safeFormat } from '../../utils/date';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { storageService } from '../../services/storage';

const CustomerHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      try {
        const account = await storageService.getAccountByUserId(user.id);
        if (account) {
          const txs = await storageService.getTransactionsByAccountId(account.id, user.id);
          setTransactions(txs.sort((a, b) => new Date(b.createdAt || b.created_at || '').getTime() - new Date(a.createdAt || a.created_at || '').getTime()));
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        toast.error('Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, [user]);

  const handleExport = () => {
    try {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Date,Description,Amount,Type,Reference\n"
        + transactions.map(tx => `${tx.createdAt || tx.created_at},${tx.description},${tx.amount},${tx.type},${tx.reference_id || ''}`).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "statement.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to export statement');
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(search.toLowerCase()) ||
                         tx.amount.toString().includes(search);
    
    if (!matchesSearch) return false;

    if (dateFilter === 'all') return true;
    
    const txDate = safeDate(tx.createdAt || tx.created_at);
    const now = new Date();
    
    if (dateFilter === 'today') {
      return txDate.toDateString() === now.toDateString();
    }
    
    if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return txDate >= weekAgo;
    }
    
    if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      return txDate >= monthAgo;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
            title="Go Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Transaction History</h2>
            <p className="text-slate-500">View and manage your past transactions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all w-full sm:w-64"
            />
          </div>
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="p-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
                  </td>
                </tr>
              ) : filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        tx.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {tx.type === 'credit' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{tx.description}</p>
                        <p className="text-xs text-slate-500">Ref: {tx.reference_id || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {safeFormat(tx.createdAt || tx.created_at, 'MMM dd, yyyy')}
                    </p>
                    <p className="text-xs text-slate-400">{safeFormat(tx.createdAt || tx.created_at, 'HH:mm')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`text-sm font-bold ${
                      tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {tx.type === 'credit' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                      Completed
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                      <Download className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && filteredTransactions.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-500">
              No transactions found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerHistory;
