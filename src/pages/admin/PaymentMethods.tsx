import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Bitcoin, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Loader2,
  Banknote
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface PaymentMethod {
  id: number;
  type: 'bank' | 'crypto';
  name: string;
  details: string;
  instructions: string;
  is_active: number;
  created_at: string;
}

import { storageService } from '../../services/storage';

const AdminPaymentMethods = () => {
  const { user } = useAuth();
  const [methods, setMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    type: 'bank' as 'bank' | 'crypto',
    name: '',
    details: '',
    instructions: '',
    is_active: 1
  });

  const fetchMethods = async () => {
    try {
      const data = await storageService.getPaymentMethods();
      setMethods(data);
    } catch (error) {
      toast.error('Failed to fetch payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const methodToSave = {
        ...formData,
        id: editingMethod ? editingMethod.id : Date.now().toString(),
        created_at: editingMethod ? editingMethod.created_at : new Date().toISOString()
      };

      await storageService.savePaymentMethod(methodToSave);
      toast.success(editingMethod ? 'Payment method updated' : 'Payment method added');
      setShowModal(false);
      setEditingMethod(null);
      setFormData({ type: 'bank', name: '', details: '', instructions: '', is_active: 1 });
      fetchMethods();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    try {
      await storageService.deletePaymentMethod(id);
      toast.success('Payment method deleted');
      fetchMethods();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      type: method.type,
      name: method.name,
      details: method.details,
      instructions: method.instructions,
      is_active: method.is_active
    });
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Payment Methods</h2>
          <p className="text-slate-500">Manage bank and crypto accounts for loan repayments</p>
        </div>
        <button 
          onClick={() => {
            setEditingMethod(null);
            setFormData({ type: 'bank', name: '', details: '', instructions: '', is_active: 1 });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
        >
          <Plus className="h-5 w-5" />
          Add New Method
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {methods.map((method) => (
          <div key={method.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${method.type === 'bank' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                {method.type === 'bank' ? <Banknote className="h-6 w-6" /> : <Bitcoin className="h-6 w-6" />}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(method)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete(method.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900">{method.name}</h3>
                {method.is_active ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-slate-300" />
                )}
              </div>
              <p className="text-sm font-mono bg-slate-50 p-2 rounded-lg text-slate-600 break-all">
                {method.details}
              </p>
              {method.instructions && (
                <p className="text-xs text-slate-500 italic">
                  {method.instructions}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">
                {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Type</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'bank' })}
                    className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                      formData.type === 'bank' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-100 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    <Banknote className="h-5 w-5" />
                    Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'crypto' })}
                    className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                      formData.type === 'crypto' ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-100 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    <Bitcoin className="h-5 w-5" />
                    Crypto
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">
                  {formData.type === 'bank' ? 'Bank Name' : 'Crypto Name (e.g. BTC, USDT)'}
                </label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder={formData.type === 'bank' ? 'e.g. Chase Bank' : 'e.g. Bitcoin (BTC)'}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">
                  {formData.type === 'bank' ? 'Account Number / IBAN' : 'Wallet Address'}
                </label>
                <input 
                  type="text"
                  required
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  placeholder={formData.type === 'bank' ? 'Enter account number' : 'Enter wallet address'}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Instructions (Optional)</label>
                <textarea 
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 h-24 resize-none"
                  placeholder="e.g. Include your name in the reference"
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active === 1}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Active and visible to customers</label>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                >
                  {editingMethod ? 'Save Changes' : 'Add Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentMethods;
