import React, { useState, useEffect } from 'react';
import { 
  Banknote, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  Loader2,
  Mail,
  User,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { safeFormat } from '../../utils/date';

import { storageService } from '../../services/storage';

interface AdminLoan {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  amount: number;
  interest_rate: number;
  status: string;
  repayment_schedule: string;
  paid_amount: number;
  created_at: string;
}

const AdminLoans = () => {
  const { user: adminUser } = useAuth();
  const [loans, setLoans] = useState<AdminLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<AdminLoan | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLoans = async () => {
    try {
      const allLoans = await storageService.getLoans();
      const users = await storageService.getUsers();

      const enrichedLoans = allLoans.map(loan => {
        const user = users.find(u => u.id === loan.userId);
        return {
          id: loan.id,
          user_id: loan.userId,
          full_name: user?.fullName || user?.full_name || 'Unknown',
          email: user?.email || 'N/A',
          amount: loan.amount,
          interest_rate: loan.interestRate || loan.interest_rate || 0,
          status: loan.status,
          repayment_schedule: loan.repaymentSchedule || loan.repayment_schedule || '',
          paid_amount: loan.paidAmount || loan.paid_amount || 0,
          created_at: loan.createdAt || loan.created_at || ''
        };
      });

      setLoans(enrichedLoans.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error) {
      toast.error('Failed to fetch loans');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleStatusUpdate = async (id: string, status: 'pending' | 'approved' | 'rejected' | 'repaying' | 'completed') => {
    if (!adminUser) return;
    try {
      const allLoans = await storageService.getLoans();
      const loan = allLoans.find(l => l.id === id);
      if (!loan) throw new Error('Loan not found');

      const updatedLoan = { ...loan, status };
      await storageService.saveLoan(updatedLoan);

      await storageService.saveNotification({
        id: Math.random().toString(36).substr(2, 9),
        userId: loan.userId,
        title: `Loan ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your loan application for $${loan.amount.toLocaleString()} has been ${status}.`,
        type: status === 'approved' ? 'success' : 'alert',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      await storageService.saveAuditLog({
        id: Math.random().toString(36).substr(2, 9),
        adminId: adminUser.id,
        adminName: adminUser.fullName || adminUser.full_name || '',
        action: 'loan_status_update',
        details: `Set loan ${id} status to ${status}`,
        createdAt: new Date().toISOString()
      });

      toast.success(`Loan ${status}`);
      fetchLoans();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !adminUser) return;
    setIsSubmitting(true);

    try {
      const allLoans = await storageService.getLoans();
      const loan = allLoans.find(l => l.id === selectedLoan.id);
      if (!loan) throw new Error('Loan not found');

      const amount = parseFloat(repaymentAmount);
      const currentPaidAmount = loan.paidAmount || loan.paid_amount || 0;
      const newPaidAmount = currentPaidAmount + amount;
      const newStatus = newPaidAmount >= loan.amount ? 'completed' : 'repaying';

      await storageService.saveLoan({
        ...loan,
        paidAmount: newPaidAmount,
        paid_amount: newPaidAmount,
        status: newStatus
      });

      await storageService.saveNotification({
        id: Math.random().toString(36).substr(2, 9),
        userId: loan.userId,
        title: 'Loan Repayment Recorded',
        message: `A repayment of $${amount.toLocaleString()} has been recorded for your loan.`,
        type: 'success',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      await storageService.saveAuditLog({
        id: Math.random().toString(36).substr(2, 9),
        adminId: adminUser.id,
        adminName: adminUser.fullName || adminUser.full_name || '',
        action: 'loan_repayment',
        details: `Recorded $${amount} repayment for loan ${loan.id}`,
        createdAt: new Date().toISOString()
      });

      toast.success('Repayment recorded');
      setSelectedLoan(null);
      setRepaymentAmount('');
      fetchLoans();
    } catch (error) {
      toast.error('Repayment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLoans = loans.filter(l => 
    l.full_name.toLowerCase().includes(search.toLowerCase()) || 
    l.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Loan Applications</h2>
          <p className="text-slate-500">Review and manage customer loan requests</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all w-full sm:w-64"
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Applicant</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Loan Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
                  </td>
                </tr>
              ) : filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                        <User className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{loan.full_name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {loan.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">${loan.amount.toLocaleString()}</p>
                    <div className="flex flex-col gap-1 mt-1">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">
                        {loan.interest_rate}% • {loan.repayment_schedule}
                      </p>
                      {(loan.status === 'approved' || loan.status === 'repaying' || loan.status === 'completed') && (
                        <div className="w-24 space-y-1">
                          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500"
                              style={{ width: `${(loan.paid_amount / loan.amount) * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-[8px] text-slate-400 font-bold">
                            Paid: ${loan.paid_amount.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">{safeFormat(loan.created_at, 'MMM dd, yyyy')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                      loan.status === 'approved' || loan.status === 'repaying' ? 'bg-emerald-100 text-emerald-700' :
                      loan.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      loan.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {loan.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleStatusUpdate(loan.id, 'approved')}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Approve"
                          >
                            <CheckCircle2 className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(loan.id, 'rejected')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Reject"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      {(loan.status === 'approved' || loan.status === 'repaying') && (
                        <button 
                          onClick={() => setSelectedLoan(loan)}
                          className="px-3 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:bg-slate-800 transition-all"
                        >
                          Record Repayment
                        </button>
                      )}
                      <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && filteredLoans.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-500">
              No loan applications found.
            </div>
          )}
        </div>
      </div>

      {/* Repayment Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div 
            className="absolute inset-0" 
            onClick={() => setSelectedLoan(null)}
          />
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative z-10">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Record Repayment</h3>
              <button onClick={() => setSelectedLoan(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleRepayment} className="p-8 space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Loan Amount</span>
                  <span className="font-bold text-slate-900">${selectedLoan.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Already Paid</span>
                  <span className="font-bold text-emerald-600">${selectedLoan.paid_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Remaining</span>
                  <span className="font-bold text-slate-900">${(selectedLoan.amount - selectedLoan.paid_amount).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Repayment Amount ($)</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  max={selectedLoan.amount - selectedLoan.paid_amount}
                  value={repaymentAmount}
                  onChange={(e) => setRepaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Repayment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLoans;
