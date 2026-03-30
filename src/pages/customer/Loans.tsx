import React, { useState, useEffect } from 'react';
import { 
  Banknote, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  X,
  AlertCircle,
  Loader2,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Bitcoin,
  Wallet,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Loan } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { safeFormat } from '../../utils/date';
import { useNavigate } from 'react-router-dom';

interface PaymentMethod {
  id: number;
  type: 'bank' | 'crypto';
  name: string;
  details: string;
  instructions: string;
}

const LoanCalculator = ({ interestRate }: { interestRate: number }) => {
  const [calcAmount, setCalcAmount] = useState('5000');
  const [calcTerm, setCalcTerm] = useState('12');

  const monthlyRate = interestRate / 100 / 12;
  const termMonths = parseInt(calcTerm);
  const amount = parseFloat(calcAmount) || 0;
  
  const monthlyPayment = amount > 0 
    ? (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1)
    : 0;

  const totalRepayment = monthlyPayment * termMonths;
  const totalInterest = totalRepayment - amount;

  return (
    <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-emerald-400" />
        Loan Calculator
      </h3>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-xs font-bold text-slate-400 uppercase">Amount: ${amount.toLocaleString()}</label>
          </div>
          <input 
            type="range" 
            min="500" 
            max="50000" 
            step="500"
            value={calcAmount}
            onChange={(e) => setCalcAmount(e.target.value)}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-xs font-bold text-slate-400 uppercase">Term: {calcTerm} Months</label>
          </div>
          <input 
            type="range" 
            min="3" 
            max="60" 
            step="3"
            value={calcTerm}
            onChange={(e) => setCalcTerm(e.target.value)}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Monthly Payment</p>
            <p className="text-xl font-bold text-emerald-400">${monthlyPayment.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Total Interest</p>
            <p className="text-xl font-bold text-slate-200">${totalInterest.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

import { storageService } from '../../services/storage';

const CustomerLoans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [amount, setAmount] = useState('');
  const [interestRate] = useState(5.5); // Fixed for demo
  const [repaymentSchedule, setRepaymentSchedule] = useState('Monthly');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasPaidFee, setHasPaidFee] = useState(false);

  const depositFeePercent = 1.5; // Example 1.5% deposit fee
  const depositFee = amount ? (parseFloat(amount) * (depositFeePercent / 100)) : 0;

  const fetchLoans = async () => {
    if (!user) return;
    try {
      const userLoans = await storageService.getLoansByUserId(user.id);
      setLoans(userLoans.sort((a, b) => new Date(b.created_at || b.createdAt || '').getTime() - new Date(a.created_at || a.createdAt || '').getTime()));
    } catch (error) {
      console.error('Error fetching loans:', error);
      toast.error('Failed to load loans');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    const data = await storageService.getPaymentMethods();
    setPaymentMethods(data);
  };

  useEffect(() => {
    fetchLoans();
    fetchPaymentMethods();
  }, [user]);

  const handleApplyClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) < 500) {
      toast.error('Minimum loan amount is $500');
      return;
    }
    setShowReviewModal(true);
  };

  const confirmSubmission = async () => {
    if (!hasPaidFee || !user) {
      toast.error('Please confirm that you have paid the deposit fee');
      return;
    }

    setIsSubmitting(true);
    try {
      const newLoan: Loan = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        amount: parseFloat(amount),
        interestRate: interestRate,
        interest_rate: interestRate,
        status: 'pending',
        repaymentSchedule: repaymentSchedule,
        repayment_schedule: repaymentSchedule,
        paidAmount: 0,
        paid_amount: 0,
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      await storageService.saveLoan(newLoan);

      await storageService.saveNotification({
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        title: 'Loan Application Submitted',
        message: `Your loan application for $${parseFloat(amount).toLocaleString()} has been received and is under review.`,
        type: 'info',
        isRead: false,
        read: false,
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

      await storageService.saveAuditLog({
        id: Math.random().toString(36).substr(2, 9),
        adminId: 'system',
        adminName: 'System',
        action: 'LOAN_APPLIED',
        details: `User ${user.email} applied for a loan of $${parseFloat(amount).toLocaleString()}`,
        createdAt: new Date().toISOString()
      });

      toast.success('Loan application submitted!');
      setAmount('');
      setShowReviewModal(false);
      setHasPaidFee(false);
      await fetchLoans();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
            title="Go Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Loan Management</h2>
            <p className="text-slate-500">Apply for and track your personal or business loans</p>
          </div>
        </div>
        <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Current Rate</p>
          <p className="text-lg font-bold text-emerald-700">{interestRate}% APR</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Application Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm sticky top-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Apply for a Loan
            </h3>
            <form onSubmit={handleApplyClick} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Loan Amount ($)</label>
                <input 
                  type="number" 
                  required
                  min="500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Repayment Schedule</label>
                <select 
                  value={repaymentSchedule}
                  onChange={(e) => setRepaymentSchedule(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                >
                  <option>Monthly</option>
                  <option>Quarterly</option>
                  <option>Annually</option>
                </select>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Interest Rate</span>
                  <span className="font-bold text-slate-900">{interestRate}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Estimated Monthly</span>
                  <span className="font-bold text-emerald-600">
                    ${amount ? (parseFloat(amount) * (1 + interestRate/100) / 12).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    Submit Application
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8">
            <LoanCalculator interestRate={interestRate} />
          </div>
        </div>

        {/* Loan List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            Your Loan History
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : loans.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 border-dashed">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Banknote className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500">You haven't applied for any loans yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {loans.map((loan) => (
                <div key={loan.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        loan.status === 'approved' || loan.status === 'repaying' ? 'bg-emerald-100 text-emerald-600' :
                        loan.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                        loan.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        <Banknote className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-900">${loan.amount.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">
                          {loan.interest_rate}% APR • {loan.repayment_schedule} • {safeFormat(loan.created_at, 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold capitalize ${
                        loan.status === 'approved' || loan.status === 'repaying' ? 'bg-emerald-100 text-emerald-700' :
                        loan.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        loan.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {(loan.status === 'approved' || loan.status === 'repaying') && <CheckCircle2 className="h-3 w-3" />}
                        {loan.status === 'pending' && <Clock className="h-3 w-3" />}
                        {loan.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                        {loan.status === 'rejected' && <XCircle className="h-3 w-3" />}
                        {loan.status}
                      </span>
                      {(loan.status === 'approved' || loan.status === 'repaying') && (
                        <button 
                          onClick={() => setShowPaymentModal(true)}
                          className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          <Wallet className="h-3 w-3" />
                          Repayment Details
                        </button>
                      )}
                    </div>
                  </div>

                  {(loan.status === 'approved' || loan.status === 'repaying' || loan.status === 'completed') && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span>Repayment Progress</span>
                        <span>{Math.round((loan.paid_amount / loan.amount) * 100)}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-1000"
                          style={{ width: `${(loan.paid_amount / loan.amount) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Paid: ${loan.paid_amount.toLocaleString()}</span>
                        <span>Remaining: ${(loan.amount - loan.paid_amount).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {loan.status === 'pending' && (
                    <p className="text-[10px] text-slate-400 italic text-right">Under review by admin</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
            <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-900">Important Note</p>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Loan approval is subject to credit assessment and verification. 
                Approved funds will be credited directly to your savings account.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Repayment Accounts</h3>
                  <p className="text-xs text-slate-500">Official channels for loan repayment</p>
                </div>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3">
                <Info className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Please use any of the accounts below to make your loan repayment. 
                  After payment, send a screenshot of your receipt to support chat for verification.
                </p>
              </div>

              <div className="space-y-4">
                {paymentMethods.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No payment methods available. Please contact support.</p>
                ) : (
                  paymentMethods.map((method) => (
                    <div key={method.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {method.type === 'bank' ? (
                            <Banknote className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Bitcoin className="h-4 w-4 text-orange-600" />
                          )}
                          <span className="text-sm font-bold text-slate-900">{method.name}</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-500">
                          {method.type}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {method.type === 'bank' ? 'Account Number / IBAN' : 'Wallet Address'}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-xs font-mono font-bold text-slate-700 break-all bg-white px-2 py-1 rounded border border-slate-100 flex-1">
                            {method.details}
                          </code>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(method.details);
                              toast.success('Copied to clipboard');
                            }}
                            className="text-[10px] font-bold text-emerald-600 hover:underline"
                          >
                            Copy
                          </button>
                        </div>
                      </div>

                      {method.instructions && (
                        <div className="pt-2 border-t border-slate-200">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Instructions</p>
                          <p className="text-xs text-slate-600 italic">{method.instructions}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Review Application</h3>
                  <p className="text-xs text-slate-500">Final step before submission</p>
                </div>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Loan Amount</span>
                  <span className="text-lg font-bold text-slate-900">${parseFloat(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Repayment Schedule</span>
                  <span className="text-sm font-bold text-slate-900">{repaymentSchedule}</span>
                </div>
                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-sm font-bold text-emerald-600">Required Deposit Fee (1.5%)</span>
                  <span className="text-lg font-bold text-emerald-600">${depositFee.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-slate-400" />
                  Payment Methods for Deposit Fee
                </h4>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <p className="text-[10px] text-amber-700 leading-relaxed">
                    Please pay the <strong>${depositFee.toLocaleString()}</strong> deposit fee to any of the accounts below. 
                    Your application will be processed once the fee is verified.
                  </p>
                </div>

                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{method.name}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">{method.type}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-[10px] font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-100 flex-1">
                          {method.details}
                        </code>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(method.details);
                            toast.success('Copied');
                          }}
                          className="text-[10px] font-bold text-emerald-600"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={hasPaidFee}
                  onChange={(e) => setHasPaidFee(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-emerald-800 font-medium group-hover:text-emerald-900 transition-colors">
                  I have paid the required deposit fee and I'm ready to submit my application for review.
                </span>
              </label>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmSubmission}
                disabled={isSubmitting || !hasPaidFee}
                className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    Final Submit
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerLoans;
