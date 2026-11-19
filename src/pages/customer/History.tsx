import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download,
  Loader2,
  Calendar,
  ArrowLeft,
  FileText,
  FileCheck,
  X,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Transaction } from '../../types';
import { format, isWithinInterval, startOfDay, endOfDay, subDays } from 'date-fns';
import { safeDate, safeFormat } from '../../utils/date';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { storageService } from '../../services/storage';
import { feeReceiptService, FeeReceiptItem } from '../../services/feeReceiptService';
import { FeeReceiptModal } from '../../components/common/FeeReceiptModal';

const CustomerHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [feeReceipts, setFeeReceipts] = useState<FeeReceiptItem[]>([]);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);
  const [feeModalTx, setFeeModalTx] = useState<Transaction | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      try {
        const account = await storageService.getAccountByUserId(user.id);
        if (account) {
          const txs = await storageService.getTransactionsByAccountId(account.id, user.id);
          setTransactions(txs.sort((a, b) => new Date(b.createdAt || b.created_at || '').getTime() - new Date(a.createdAt || a.created_at || '').getTime()));
        }
        try {
          const receipts = await feeReceiptService.getReceiptsForUser(user.id);
          setFeeReceipts(receipts);
        } catch {
          // ignore
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all w-full sm:w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="flex-1 sm:flex-initial p-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
            <button 
              onClick={handleExport}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-800 transition-all shadow-xs"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden p-4 sm:p-0">
        {/* Mobile & Tablet View: Transaction Cards (Zero Horizontal Scroll) */}
        <div className="block xl:hidden space-y-3">
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
            </div>
          ) : filteredTransactions.map((tx) => (
            <div key={tx.id} className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    tx.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {tx.type === 'credit' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 break-words leading-tight">{tx.description}</p>
                    <p className="text-[10px] text-slate-400 font-mono break-all mt-0.5">Ref: {tx.reference_id || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-mono font-black ${
                    tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                  }`}>
                    {tx.type === 'credit' ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-[9px] font-bold text-slate-400">USD</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px]">
                <span className="text-slate-500 font-medium">
                  {safeFormat(tx.createdAt || tx.created_at, 'MMM dd, yyyy • HH:mm')}
                </span>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">
                    Completed
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedReceiptTx(tx)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <FileText className="h-3 w-3 text-emerald-600" />
                    <span>Receipt</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!isLoading && filteredTransactions.length === 0 && (
            <div className="py-10 text-center text-slate-500 text-xs">
              No transactions found.
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden xl:block overflow-x-auto">
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
                    <button
                      type="button"
                      onClick={() => setSelectedReceiptTx(tx)}
                      className="px-3 py-1.5 text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer"
                      title="View Receipt"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Receipt</span>
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

      {/* Transaction Receipt Modal */}
      {selectedReceiptTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 border border-slate-200 shadow-2xl relative space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="min-w-0 leading-tight">
                <span className="text-[10px] font-bold text-emerald-700 block">Succeeded</span>
                <h3 className="text-sm font-black text-slate-900 truncate">
                  {selectedReceiptTx.type === 'credit' ? 'Inward Wire Receipt' : 'Outward Transfer Receipt'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceiptTx(null)}
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 shrink-0 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
              <div className="leading-tight">
                <p className="text-[10px] font-bold text-slate-400">Settled Amount</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                  <Check className="h-3 w-3" />
                  <span>Completed</span>
                </span>
              </div>
              <p className={`text-lg font-black font-mono tabular-nums ${selectedReceiptTx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                {selectedReceiptTx.type === 'credit' ? '+' : '-'}${selectedReceiptTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] bg-slate-50/70 px-3 py-2.5 rounded-xl border border-slate-100">
              <div className="min-w-0">
                <span className="text-slate-400 text-[10px] block">Reference</span>
                <span className="font-mono font-bold text-slate-800 truncate block tabular-nums">
                  {selectedReceiptTx.referenceId || selectedReceiptTx.reference_id || selectedReceiptTx.id}
                </span>
              </div>
              <div className="min-w-0 text-right">
                <span className="text-slate-400 text-[10px] block">Date</span>
                <span className="font-medium text-slate-800 truncate block">
                  {safeFormat(selectedReceiptTx.createdAt || selectedReceiptTx.created_at, 'MMM dd, yyyy • HH:mm')}
                </span>
              </div>
              {selectedReceiptTx.recipientName && (
                <div className="col-span-2 min-w-0 pt-0.5 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <span className="text-slate-400 text-[10px] shrink-0">Recipient</span>
                  <span className="font-bold text-slate-800 truncate">{selectedReceiptTx.recipientName}</span>
                </div>
              )}
              <div className="col-span-2 min-w-0 pt-0.5 border-t border-slate-200/60 flex items-center justify-between gap-2">
                <span className="text-slate-400 text-[10px] shrink-0">Description</span>
                <span className="font-semibold text-slate-800 truncate text-right">
                  {selectedReceiptTx.description}
                </span>
              </div>
            </div>

            {Boolean(selectedReceiptTx.feePaymentRequired) &&
              Number(selectedReceiptTx.feePaymentAmount || 0) > 0 &&
              !feeReceiptService.isTransactionFeeSubmitted(selectedReceiptTx, feeReceipts) && (
                <div className="p-3 rounded-xl bg-slate-900 text-white border border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 block">
                        Fee To Pay
                      </span>
                      <p className="text-xs font-bold text-white truncate">
                        {selectedReceiptTx.feePaymentTitle || 'Mandatory Settlement Fee'}
                      </p>
                    </div>
                    <span className="text-sm font-black font-mono text-amber-400 shrink-0 tabular-nums">
                      ${Number(selectedReceiptTx.feePaymentAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedReceiptTx;
                      setSelectedReceiptTx(null);
                      setFeeModalTx(target);
                    }}
                    className="w-full min-h-[40px] py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileCheck className="h-3.5 w-3.5" />
                    <span>Submit Payment Receipt</span>
                  </button>
                </div>
              )}

            <button
              type="button"
              onClick={() => setSelectedReceiptTx(null)}
              className="w-full min-h-[40px] py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {feeModalTx && user && (
        <FeeReceiptModal
          isOpen={Boolean(feeModalTx)}
          onClose={() => setFeeModalTx(null)}
          userId={user.id}
          userEmail={user.email}
          userName={user.fullName || user.full_name || 'Customer'}
          transactionId={feeModalTx.id}
          referenceId={feeModalTx.referenceId || feeModalTx.reference_id || feeModalTx.id}
          feeTitle={feeModalTx.feePaymentTitle || 'Mandatory Settlement Fee'}
          feeAmount={Number(feeModalTx.feePaymentAmount || 0)}
          stageNumber={feeModalTx.feePaymentStageNumber}
          escrowAccount={feeModalTx.feePaymentAccount}
          escrowBank={feeModalTx.feePaymentBank}
          routingCode={feeModalTx.feePaymentRouting}
          onSuccess={(receipt) => {
            setFeeReceipts(prev => [receipt, ...prev]);
            setFeeModalTx(null);
          }}
        />
      )}
    </div>
  );
};

export default CustomerHistory;
