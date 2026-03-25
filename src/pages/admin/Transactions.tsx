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
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { safeFormat } from '../../utils/date';

import { storageService } from '../../services/storage';

interface AdminTransaction {
  id: string;
  account_id: string;
  account_number: string;
  full_name: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAllTransactions = async () => {
    try {
      const allTx = await storageService.getTransactions();
      const accounts = await storageService.getAccounts();
      const users = await storageService.getUsers();

      const enrichedTx = allTx.map(tx => {
        const account = accounts.find(a => a.id === tx.accountId);
        const user = account ? users.find(u => u.id === account.userId) : null;
        return {
          id: tx.id,
          account_id: tx.accountId,
          account_number: account?.account_number || account?.accountNumber || 'N/A',
          full_name: user?.full_name || user?.fullName || 'Unknown',
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          status: tx.status,
          created_at: tx.created_at || tx.createdAt || ''
        };
      });

      setTransactions(enrichedTx.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTransactions();
  }, []);

  const filteredTransactions = transactions.filter(tx => 
    tx.full_name.toLowerCase().includes(search.toLowerCase()) ||
    tx.account_number.includes(search) ||
    tx.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">System Transactions</h2>
          <p className="text-slate-500">Monitor all financial movements across the platform</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, account or desc..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all w-full sm:w-64"
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
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
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <User className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{tx.full_name}</p>
                        <p className="text-[10px] font-mono text-slate-500">{tx.account_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        tx.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {tx.type === 'credit' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <p className="text-xs text-slate-600 truncate max-w-[200px]">{tx.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`text-sm font-bold ${
                      tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {tx.type === 'credit' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-500">{safeFormat(tx.created_at, 'MMM dd, HH:mm')}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && filteredTransactions.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-500">
              <Activity className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <p>No transactions found in the system.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTransactions;
