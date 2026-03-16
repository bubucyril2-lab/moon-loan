import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  UserMinus,
  DollarSign,
  Loader2,
  Mail,
  User,
  X,
  ArrowRight,
  MessageSquare,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { safeFormat, safeDate } from '../../utils/date';

interface Customer {
  id: number;
  email: string;
  full_name: string;
  status: string;
  account_number: string;
  balance: number;
  created_at: string;
  pin?: string;
}

const AdminCustomers = () => {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showAdjustModal, setShowAdjustModal] = useState<Customer | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState<Customer | null>(null);
  const [showMessageModal, setShowMessageModal] = useState<Customer | null>(null);
  const [showResetPinModal, setShowResetPinModal] = useState<Customer | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Customer | null>(null);
  const [newPin, setNewPin] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [messageForm, setMessageForm] = useState({ title: '', message: '', type: 'info' });
  const [isSending, setIsSending] = useState(false);
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustDescription, setAdjustDescription] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    country: '',
    city: '',
    age: ''
  });

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/admin/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerDetails = async (id: number) => {
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setShowDetailsModal(data);
    } catch (error) {
      toast.error('Failed to fetch customer details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [token]);

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAdjustModal) return;
    setIsAdjusting(true);

    try {
      const res = await fetch(`/api/admin/customers/${showAdjustModal.id}/adjust-balance`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          amount: parseFloat(adjustAmount),
          type: adjustType,
          description: adjustDescription
        })
      });

      if (res.ok) {
        toast.success('Balance adjusted successfully');
        setShowAdjustModal(null);
        setAdjustAmount('');
        setAdjustDescription('');
        fetchCustomers();
      } else {
        throw new Error('Adjustment failed');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/customers/${id}/status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        toast.success(`Customer ${status}`);
        fetchCustomers();
      }
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/customers/${showEditModal.id}/update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        toast.success('Customer profile updated');
        setShowEditModal(null);
        fetchCustomers();
      }
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMessageModal) return;
    setIsSending(true);
    try {
      const res = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          userId: showMessageModal.id,
          ...messageForm
        })
      });
      if (res.ok) {
        toast.success('Message sent successfully');
        setShowMessageModal(null);
        setMessageForm({ title: '', message: '', type: 'info' });
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetPinModal) return;
    setIsResetting(true);
    try {
      const res = await fetch(`/api/admin/customers/${showResetPinModal.id}/reset-pin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ newPin })
      });
      if (res.ok) {
        toast.success('Transfer PIN reset successfully');
        setShowResetPinModal(null);
        setNewPin('');
      }
    } catch (error) {
      toast.error('Failed to reset PIN');
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    if (!window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'enable' : 'disable'} this account?`)) return;

    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/customers/${userId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        toast.success(`Account ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully`);
        fetchCustomerDetails(userId);
        fetchCustomers();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/customers/${showDeleteConfirm.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Account deleted successfully');
        setShowDeleteConfirm(null);
        fetchCustomers();
      }
    } catch (error) {
      toast.error('Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (customer: Customer) => {
    setShowEditModal(customer);
    setEditForm({
      full_name: customer.full_name,
      email: customer.email,
      country: (customer as any).country || '',
      city: (customer as any).city || '',
      age: (customer as any).age || ''
    });
  };

  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.account_number?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Customer Management</h2>
          <p className="text-slate-500">Manage bank members and their account status</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search customers..." 
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Account Info</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">PIN Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
                  </td>
                </tr>
              ) : filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{customer.full_name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {customer.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-mono text-slate-600">{customer.account_number || 'N/A'}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Savings Account</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">${customer.balance?.toLocaleString() || '0.00'}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {customer.pin ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px] uppercase">
                        <ShieldCheck className="h-3 w-3" />
                        Set
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 font-bold text-[10px] uppercase">
                        <XCircle className="h-3 w-3" />
                        Not Set
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                        customer.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        customer.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {customer.status}
                      </span>
                      {customer.status !== 'pending' && (
                        <button 
                          onClick={() => handleStatusUpdate(customer.id, customer.status === 'active' ? 'disabled' : 'active')}
                          className={`p-1 rounded-md transition-all ${
                            customer.status === 'active' 
                              ? 'text-red-500 hover:bg-red-50' 
                              : 'text-emerald-500 hover:bg-emerald-50'
                          }`}
                          title={customer.status === 'active' ? 'Disable Account' : 'Enable Account'}
                        >
                          {customer.status === 'active' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setShowMessageModal(customer)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                        title="Send Message"
                      >
                        <MessageSquare className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => openEditModal(customer)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                        title="Edit Profile"
                      >
                        <User className="h-5 w-5" />
                      </button>
                      {customer.status === 'active' && (
                        <button 
                          onClick={() => fetchCustomerDetails(customer.id)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Activity className="h-5 w-5" />
                        </button>
                      )}
                      {customer.status === 'active' && (
                        <button 
                          onClick={() => setShowAdjustModal(customer)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="Adjust Balance"
                        >
                          <DollarSign className="h-5 w-5" />
                        </button>
                      )}
                      {customer.status === 'pending' && (
                        <button 
                          onClick={() => handleStatusUpdate(customer.id, 'active')}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Approve"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </button>
                      )}
                      <button 
                        onClick={() => setShowResetPinModal(customer)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                        title="Reset Transfer PIN"
                      >
                        <ShieldCheck className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(customer)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Account"
                      >
                        <UserMinus className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && filteredCustomers.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-500">
              No customers found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Customer Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div 
            className="absolute inset-0" 
            onClick={() => setShowDetailsModal(null)}
          />
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative z-10">
            <button 
              onClick={() => setShowDetailsModal(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center">
                <User className="h-10 w-10 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{showDetailsModal.customer.full_name}</h3>
                <p className="text-slate-500">{showDetailsModal.customer.email}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                    {showDetailsModal.customer.account_number}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    showDetailsModal.customer.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {showDetailsModal.customer.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                <div>
                  <h4 className="font-bold text-slate-900 mb-4">Recent Transactions</h4>
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100/50">
                        <tr>
                          <th className="px-4 py-3 font-bold text-slate-500">Date</th>
                          <th className="px-4 py-3 font-bold text-slate-500">Description</th>
                          <th className="px-4 py-3 font-bold text-slate-500 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {showDetailsModal.transactions.map((tx: any) => (
                          <tr key={tx.id}>
                            <td className="px-4 py-3 text-slate-500">{safeDate(tx.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-slate-900">{tx.description}</td>
                            <td className={`px-4 py-3 text-right font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                              {tx.type === 'credit' ? '+' : '-'}${tx.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {showDetailsModal.transactions.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">No recent transactions</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-4">Loan History</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {showDetailsModal.loans.map((loan: any) => (
                      <div key={loan.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase">Loan #{loan.id}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            loan.status === 'approved' || loan.status === 'repaying' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                            {loan.status}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-slate-900">${loan.amount.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">Interest: {loan.interest_rate}%</p>
                      </div>
                    ))}
                    {showDetailsModal.loans.length === 0 && (
                      <div className="col-span-2 p-8 text-center text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        No loan applications found
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-slate-900 rounded-3xl text-white">
                  <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
                  <h4 className="text-3xl font-bold">${showDetailsModal.customer.balance.toLocaleString()}</h4>
                  <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Transfer PIN</span>
                      <span className="font-mono font-bold text-emerald-400">{showDetailsModal.customer.pin || 'Not Set'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Member Since</span>
                      <span className="font-bold">{safeDate(showDetailsModal.customer.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Total Loans</span>
                      <span className="font-bold">{showDetailsModal.loans.length}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-3xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-slate-900">Quick Actions</h4>
                  <button 
                    onClick={() => {
                      setShowDetailsModal(null);
                      setShowAdjustModal(showDetailsModal.customer);
                    }}
                    className="w-full py-3 bg-slate-100 text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    Adjust Balance
                  </button>
                  <button 
                    onClick={() => {
                      setShowDetailsModal(null);
                      setShowMessageModal(showDetailsModal.customer);
                    }}
                    className="w-full py-3 bg-slate-100 text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Send Message
                  </button>
                  <button 
                    onClick={() => {
                      setShowDetailsModal(null);
                      setShowResetPinModal(showDetailsModal.customer);
                    }}
                    className="w-full py-3 bg-amber-50 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Reset Transfer PIN
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(showDetailsModal.customer.id, showDetailsModal.customer.status)}
                    disabled={isUpdatingStatus}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      showDetailsModal.customer.status === 'active'
                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {showDetailsModal.customer.status === 'active' ? (
                      <>
                        <UserMinus className="h-4 w-4" />
                        {isUpdatingStatus ? 'Disabling...' : 'Disable Account'}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        {isUpdatingStatus ? 'Enabling...' : 'Enable Account'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showMessageModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div 
            className="absolute inset-0" 
            onClick={() => setShowMessageModal(null)}
          />
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative z-10">
            <button 
              onClick={() => setShowMessageModal(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-6">Send Message to {showMessageModal.full_name}</h3>
            
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Message Type</label>
                <select 
                  value={messageForm.type}
                  onChange={(e) => setMessageForm({...messageForm, type: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                >
                  <option value="info">Information</option>
                  <option value="success">Success</option>
                  <option value="alert">Alert / Warning</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Subject</label>
                <input 
                  type="text" 
                  required
                  value={messageForm.title}
                  onChange={(e) => setMessageForm({...messageForm, title: e.target.value})}
                  placeholder="e.g. Account Verification"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Message Content</label>
                <textarea 
                  required
                  rows={4}
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                  placeholder="Type your message here..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={isSending}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    <MessageSquare className="h-5 w-5" />
                    Send Notification
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div 
            className="absolute inset-0" 
            onClick={() => setShowEditModal(null)}
          />
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative z-10">
            <button 
              onClick={() => setShowEditModal(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-6">Edit Customer Profile</h3>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Country</label>
                  <input 
                    type="text" 
                    value={editForm.country}
                    onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">City</label>
                  <input 
                    type="text" 
                    value={editForm.city}
                    onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Age</label>
                <input 
                  type="number" 
                  value={editForm.age}
                  onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={isUpdating}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
      {showAdjustModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div 
            className="absolute inset-0" 
            onClick={() => setShowAdjustModal(null)}
          />
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative z-10">
            <button 
              onClick={() => setShowAdjustModal(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Adjust Balance</h3>
            <p className="text-sm text-slate-500 mb-8">
              Adjusting balance for <span className="font-bold text-slate-900">{showAdjustModal.full_name}</span>
            </p>
            
            <form onSubmit={handleAdjustBalance} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => setAdjustType('credit')}
                  className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                    adjustType === 'credit' 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Credit (+)
                </button>
                <button 
                  type="button"
                  onClick={() => setAdjustType('debit')}
                  className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                    adjustType === 'debit' 
                      ? 'bg-red-50 border-red-500 text-red-700' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Debit (-)
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Amount ($)</label>
                <input 
                  type="number" 
                  required
                  min="0.01"
                  step="0.01"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Description</label>
                <input 
                  type="text" 
                  required
                  value={adjustDescription}
                  onChange={(e) => setAdjustDescription(e.target.value)}
                  placeholder="Reason for adjustment"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={isAdjusting}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                {isAdjusting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    Confirm Adjustment
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {showResetPinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div 
            className="absolute inset-0" 
            onClick={() => setShowResetPinModal(null)}
          />
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative z-10">
            <button 
              onClick={() => setShowResetPinModal(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Reset Transfer PIN</h3>
            <p className="text-sm text-slate-500 mb-8">
              Set a new 4-6 digit PIN for <span className="font-bold text-slate-900">{showResetPinModal.full_name}</span>
            </p>
            
            <form onSubmit={handleResetPin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">New PIN</label>
                <input 
                  type="password" 
                  required
                  maxLength={6}
                  minLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter new PIN"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-center text-2xl tracking-[1em]"
                />
              </div>

              <button 
                type="submit"
                disabled={isResetting}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                {isResetting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Reset PIN'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div 
            className="absolute inset-0" 
            onClick={() => setShowDeleteConfirm(null)}
          />
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative z-10">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserMinus className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete Account?</h3>
            <p className="text-sm text-slate-500 text-center mb-8">
              Are you sure you want to delete <span className="font-bold text-slate-900">{showDeleteConfirm.full_name}</span>'s account? This action cannot be undone and all associated data will be lost.
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-900 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
