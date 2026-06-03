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
  ShieldCheck,
  RefreshCcw,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { safeFormat, safeDate } from '../../utils/date';

import { storageService } from '../../services/storage';
import { firebaseAuthService } from '../../services/firebaseAuthService';

interface Customer {
  id: string;
  email: string;
  full_name: string;
  status: string;
  account_number: string;
  accountId?: string;
  balance: number;
  created_at: string;
  transactionPin?: string;
}

const AdminCustomers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showAdjustModal, setShowAdjustModal] = useState<Customer | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState<Customer | null>(null);
  const [showMessageModal, setShowMessageModal] = useState<Customer | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Customer | null>(null);
  const [showResetPinModal, setShowResetPinModal] = useState<Customer | null>(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState<Customer | null>(null);
  const [newPin, setNewPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [messageForm, setMessageForm] = useState({ title: '', message: '', type: 'info' });
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustDescription, setAdjustDescription] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    country: '',
    city: '',
    age: '',
    password: ''
  });

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching all users...');
      const allUsers = await storageService.getUsers();
      console.log('Total users fetched:', allUsers.length);
      
      const users = allUsers.filter(u => u.role === 'customer');
      console.log('Customer users filtered:', users.length);
      if (users.length > 0) {
        console.log('First customer role:', users[0].role);
      } else {
        console.log('No customers found. Roles of all users:', allUsers.map(u => u.role));
      }

      console.log('Fetching all accounts...');
      const accounts = await storageService.getAccounts();
      console.log('Total accounts fetched:', accounts.length);
      
      const customerData = users.map(u => {
        const account = accounts.find(a => a.userId === u.id || (a as any).user_id === u.id);
        return {
          id: u.id,
          email: u.email,
          full_name: u.full_name || u.fullName || '',
          status: u.status,
          account_number: account?.accountNumber || account?.account_number || '',
          accountId: account?.id,
          balance: account?.balance || 0,
          created_at: u.created_at || u.createdAt || '',
          transactionPin: u.transactionPin
        };
      });
      console.log('Mapped customer data:', customerData.length);
      setCustomers(customerData);
    } catch (error) {
      console.error('Error in fetchCustomers:', error);
      toast.error('Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerDetails = async (id: string) => {
    setIsLoadingDetails(true);
    try {
      const [customer, account, loans] = await Promise.all([
        storageService.getUserById(id),
        storageService.getAccountByUserId(id),
        storageService.getLoansByUserId(id)
      ]);

      if (!customer) {
        throw new Error('User record not found');
      }

      // If account is missing, we'll use a default object to avoid crashing
      const safeAccount = account || {
        id: 'no-account',
        accountNumber: 'N/A',
        account_number: 'N/A',
        balance: 0
      };

      const transactions = account 
        ? await storageService.getTransactionsByAccountId(account.id)
        : [];
      
      const sortedTransactions = [...transactions].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setShowDetailsModal({
        customer: {
          ...customer,
          accountId: safeAccount.id,
          account_number: safeAccount.accountNumber || safeAccount.account_number,
          balance: safeAccount.balance
        },
        transactions: sortedTransactions,
        loans
      });
    } catch (error: any) {
      console.error('Error fetching customer details:', error);
      const errorMessage = error.message || 'Failed to fetch customer details';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAdjustModal || !user) return;
    setIsAdjusting(true);

    try {
      let account = showAdjustModal.accountId && showAdjustModal.accountId !== 'no-account'
        ? await storageService.getAccountById(showAdjustModal.accountId)
        : await storageService.getAccountByUserId(showAdjustModal.id);
        
      if (!account) {
        // Create an account if missing
        const newAccount = {
          id: Math.random().toString(36).substr(2, 9),
          userId: showAdjustModal.id,
          accountNumber: '30' + Math.floor(Math.random() * 9000000000),
          balance: 0,
          status: 'active',
          createdAt: new Date().toISOString()
        };
        await storageService.saveAccount(newAccount);
        account = newAccount;
      }

      const amount = parseFloat(adjustAmount);
      if (isNaN(amount) || amount <= 0) throw new Error('Please enter a valid amount greater than 0');

      const currentBalance = Number(account.balance) || 0;
      const newBalance = adjustType === 'credit' ? currentBalance + amount : currentBalance - amount;

      if (newBalance < 0) throw new Error('Insufficient balance for this debit operation');

      await storageService.saveAccount({ ...account, balance: newBalance });
      
      await storageService.saveTransaction({
        id: Math.random().toString(36).substr(2, 9),
        accountId: account.id,
        userId: showAdjustModal.id,
        type: adjustType,
        amount,
        description: adjustDescription || `Balance adjustment by admin`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

      await storageService.saveNotification({
        id: Math.random().toString(36).substr(2, 9),
        userId: showAdjustModal.id,
        title: 'Account Balance Adjusted',
        message: `Your account balance has been ${adjustType === 'credit' ? 'credited' : 'debited'} with $${amount.toLocaleString()}.`,
        type: adjustType === 'credit' ? 'success' : 'alert',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      await storageService.saveAuditLog({
        id: Math.random().toString(36).substr(2, 9),
        adminId: user.id,
        adminName: user.fullName || user.full_name || '',
        action: 'adjust_balance',
        details: `${adjustType} $${amount} for ${showAdjustModal.full_name}`,
        createdAt: new Date().toISOString()
      });

      toast.success('Balance adjusted successfully');
      setShowAdjustModal(null);
      setAdjustAmount('');
      setAdjustDescription('');
      fetchCustomers();
    } catch (error: any) {
      let message = error.message;
      try {
        const parsed = JSON.parse(error.message);
        message = parsed.error || error.message;
      } catch (e) {
        // Not a JSON string
      }
      toast.error(message);
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'pending' | 'active' | 'disabled') => {
    if (!user) return;
    try {
      const customer = await storageService.getUserById(id);
      if (!customer) throw new Error('Customer not found');

      await storageService.saveUser({ ...customer, status });

      await storageService.saveNotification({
        id: Math.random().toString(36).substr(2, 9),
        userId: id,
        title: 'Account Status Updated',
        message: `Your account status has been updated to ${status}.`,
        type: status === 'active' ? 'success' : 'alert',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      await storageService.saveAuditLog({
        id: Math.random().toString(36).substr(2, 9),
        adminId: user.id,
        adminName: user.fullName || user.full_name || '',
        action: 'update_status',
        details: `Set status to ${status} for ${customer.full_name || customer.fullName}`,
        createdAt: new Date().toISOString()
      });

      toast.success(`Customer ${status}`);
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message || 'Update failed');
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetPinModal || !user) return;
    
    if (!newPin || newPin.length < 4) {
      toast.error('PIN must be at least 4 digits');
      return;
    }

    setIsResettingPin(true);
    try {
      const customer = await storageService.getUserById(showResetPinModal.id);
      if (!customer) throw new Error('Customer not found');

      await storageService.saveUser({ ...customer, transactionPin: newPin });

      await storageService.saveNotification({
        id: Math.random().toString(36).substr(2, 9),
        userId: showResetPinModal.id,
        title: 'Transfer PIN Updated',
        message: `Your transaction PIN has been updated by an administrator to: ${newPin}. Please change it if necessary.`,
        type: 'alert',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      await storageService.saveAuditLog({
        id: Math.random().toString(36).substr(2, 9),
        adminId: user.id,
        adminName: user.fullName || user.full_name || '',
        action: 'reset_pin',
        details: `Updated transaction PIN for ${customer.full_name || customer.fullName} to ${newPin}`,
        createdAt: new Date().toISOString()
      });

      toast.success('Transaction PIN updated successfully');
      setShowResetPinModal(null);
      setNewPin('');
      if (showDetailsModal) {
        await fetchCustomerDetails(showResetPinModal.id);
      }
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message || 'Update failed');
    } finally {
      setIsResettingPin(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetPasswordModal || !user) return;
    
    setIsResettingPassword(true);
    try {
      await firebaseAuthService.forgotPassword(showResetPasswordModal.email);

      await storageService.saveNotification({
        id: Math.random().toString(36).substr(2, 9),
        userId: showResetPasswordModal.id,
        title: 'Password Reset Email Sent',
        message: `A password reset email has been sent to your email address by an administrator.`,
        type: 'alert',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      await storageService.saveAuditLog({
        id: Math.random().toString(36).substr(2, 9),
        adminId: user.id,
        adminName: user.fullName || user.full_name || '',
        action: 'send_password_reset',
        details: `Sent password reset email to ${showResetPasswordModal.full_name}`,
        createdAt: new Date().toISOString()
      });

      toast.success('Password reset email sent successfully');
      setShowResetPasswordModal(null);
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal || !user) return;
    setIsUpdating(true);
    try {
      const customer = await storageService.getUserById(showEditModal.id);
      if (!customer) throw new Error('Customer not found');

      const updateData: any = {
        ...customer,
        full_name: editForm.full_name,
        fullName: editForm.full_name,
        email: editForm.email,
        country: editForm.country,
        city: editForm.city,
        age: parseInt(editForm.age) || 0
      };

      if (editForm.password && editForm.password.trim().length >= 6) {
        updateData.password = editForm.password;
      }

      await storageService.saveUser(updateData);

      if (editForm.password && editForm.password.trim().length >= 6) {
        await storageService.saveNotification({
          id: Math.random().toString(36).substr(2, 9),
          userId: showEditModal.id,
          title: 'Security Update',
          message: 'Your account password has been updated by an administrator.',
          type: 'alert',
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }

      await storageService.saveAuditLog({
        id: Math.random().toString(36).substr(2, 9),
        adminId: user.id,
        adminName: user.fullName || user.full_name || '',
        action: 'edit_profile',
        details: `Updated profile for ${customer.full_name || customer.fullName}`,
        createdAt: new Date().toISOString()
      });

      toast.success('Customer profile updated');
      setShowEditModal(null);
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMessageModal || !user) return;
    setIsSending(true);
    try {
      await storageService.saveNotification({
        id: Math.random().toString(36).substr(2, 9),
        userId: showMessageModal.id,
        title: messageForm.title,
        message: messageForm.message,
        type: messageForm.type as any,
        isRead: false,
        createdAt: new Date().toISOString()
      });

      await storageService.saveAuditLog({
        id: Math.random().toString(36).substr(2, 9),
        adminId: user.id,
        adminName: user.fullName || user.full_name || '',
        action: 'send_notification',
        details: `Sent notification to ${showMessageModal.full_name}: ${messageForm.title}`,
        createdAt: new Date().toISOString()
      });

      toast.success('Message sent successfully');
      setShowMessageModal(null);
      setMessageForm({ title: '', message: '', type: 'info' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    
    setIsUpdatingStatus(true);
    try {
      await handleStatusUpdate(userId, newStatus);
      await fetchCustomerDetails(userId);
      await fetchCustomers();
      toast.success(`Account ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm || !user) return;
    setIsDeleting(true);
    try {
      const account = await storageService.getAccountByUserId(showDeleteConfirm.id);
      
      await storageService.deleteUser(showDeleteConfirm.id);
      if (account) {
        await storageService.deleteAccount(account.id);
        await storageService.deleteTransactionsByAccountId(account.id);
      }
      await storageService.deleteLoansByUserId(showDeleteConfirm.id);
      await storageService.deleteNotificationsByUserId(showDeleteConfirm.id);

      await storageService.saveAuditLog({
        id: Math.random().toString(36).substr(2, 9),
        adminId: user.id,
        adminName: user.fullName || user.full_name || '',
        action: 'delete_account',
        details: `Deleted account for ${showDeleteConfirm.full_name}`,
        createdAt: new Date().toISOString()
      });

      toast.success('Account deleted successfully');
      setShowDeleteConfirm(null);
      fetchCustomers();
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
      age: (customer as any).age || '',
      password: ''
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">PIN</th>
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
                  <td className="px-6 py-4">
                    {customer.transactionPin ? (
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100 font-mono">
                        {customer.transactionPin}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium italic">Not Set</span>
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
                        title="Send Notification"
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
                          onClick={() => {
                            setShowResetPinModal(customer);
                            setNewPin('');
                          }}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="Transfer Reset (PIN)"
                        >
                          <RefreshCcw className="h-5 w-5" />
                        </button>
                      )}
                      {customer.status === 'active' && (
                        <button 
                          onClick={() => {
                            setShowResetPasswordModal(customer);
                            setNewPassword('');
                          }}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="Reset Password"
                        >
                          <Lock className="h-5 w-5" />
                        </button>
                      )}
                      {customer.status === 'active' && (
                        <button 
                          onClick={() => fetchCustomerDetails(customer.id)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Manage Account"
                        >
                          <ShieldCheck className="h-5 w-5" />
                        </button>
                      )}
                      {customer.status === 'active' && (
                        <button 
                          onClick={() => setShowAdjustModal(customer)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="Credit/Debit Balance"
                        >
                          <DollarSign className="h-5 w-5" />
                        </button>
                      )}
                      {customer.status === 'pending' && (
                        <button 
                          onClick={() => handleStatusUpdate(customer.id, 'active')}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Enable Account (Approve)"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </button>
                      )}
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
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl relative z-10 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Customer Details</h3>
              <button onClick={() => setShowDetailsModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-8 max-h-[80vh] overflow-y-auto">
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
                        <span className="text-slate-400">Member Since</span>
                        <span className="font-bold">{safeDate(showDetailsModal.customer.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Total Loans</span>
                        <span className="font-bold">{showDetailsModal.loans.length}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Transfer PIN</span>
                        <span className={`font-bold ${showDetailsModal.customer.transactionPin ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {showDetailsModal.customer.transactionPin || 'NOT SET'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-white rounded-3xl border border-slate-200 space-y-4">
                    <h4 className="font-bold text-slate-900">Quick Actions</h4>
                    <button 
                      onClick={() => {
                        setShowResetPinModal(showDetailsModal.customer);
                        setNewPin('');
                      }}
                      className="w-full py-3 bg-slate-100 text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Reset Transfer PIN
                    </button>
                    <button 
                      onClick={() => {
                        setShowDetailsModal(null);
                        setShowResetPasswordModal(showDetailsModal.customer);
                        setNewPassword('');
                      }}
                      className="w-full py-3 bg-slate-100 text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      Reset Password
                    </button>
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
        </div>
      )}
      {showMessageModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div 
            className="absolute inset-0" 
            onClick={() => setShowMessageModal(null)}
          />
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Send Message</h3>
              <button onClick={() => setShowMessageModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-8 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Send Message to {showMessageModal.full_name}</h3>
              
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
        </div>
      )}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div 
            className="absolute inset-0" 
            onClick={() => setShowEditModal(null)}
          />
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Edit Profile</h3>
              <button onClick={() => setShowEditModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-8 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Edit Customer Profile</h3>
              
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

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <label className="text-sm font-bold text-slate-700">Reset Password (Optional)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={editForm.password}
                      onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                      placeholder="Enter new password to reset"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Leave blank to keep current password. Min 6 characters.</p>
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
        </div>
      )}
      {showAdjustModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div 
            className="absolute inset-0" 
            onClick={() => setShowAdjustModal(null)}
          />
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Adjust Balance</h3>
              <button onClick={() => setShowAdjustModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-8 max-h-[80vh] overflow-y-auto">
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
        </div>
      )}

      {showResetPinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div 
            className="absolute inset-0" 
            onClick={() => setShowResetPinModal(null)}
          />
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Reset Transfer PIN</h3>
              <button onClick={() => setShowResetPinModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-8 max-h-[80vh] overflow-y-auto">
              <p className="text-sm text-slate-500 mb-6">
                Set a new transaction PIN for <span className="font-bold text-slate-900">{showResetPinModal.full_name}</span>
              </p>

              {showResetPinModal.transactionPin && (
                <div className="mb-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Current PIN</p>
                  <p className="text-2xl font-mono font-bold text-emerald-700 tracking-[0.2em]">{showResetPinModal.transactionPin}</p>
                </div>
              )}
              
              <form onSubmit={handleResetPin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">New PIN (Typed)</label>
                  <input 
                    type="text" 
                    required
                    maxLength={6}
                    minLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 4-6 digit PIN"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-center text-2xl tracking-[0.5em]"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isResettingPin}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  {isResettingPin ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                      Update Transfer PIN
                      <RefreshCcw className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showResetPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div 
            className="absolute inset-0" 
            onClick={() => setShowResetPasswordModal(null)}
          />
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Reset Password</h3>
              <button onClick={() => setShowResetPasswordModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-8 max-h-[80vh] overflow-y-auto">
              <p className="text-sm text-slate-500 mb-6">
                Set a new account password for <span className="font-bold text-slate-900">{showResetPasswordModal.full_name}</span>
              </p>
              
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">New Password</label>
                  <input 
                    type="text" 
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  />
                  <p className="text-[10px] text-slate-400">Minimum 6 characters recommended.</p>
                </div>

                <button 
                  type="submit"
                  disabled={isResettingPassword}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  {isResettingPassword ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                      Update Password
                      <Lock className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div 
            className="absolute inset-0" 
            onClick={() => setShowDeleteConfirm(null)}
          />
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative z-10">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Delete Account?</h3>
              <button onClick={() => setShowDeleteConfirm(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserMinus className="h-8 w-8 text-red-600" />
              </div>
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
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
