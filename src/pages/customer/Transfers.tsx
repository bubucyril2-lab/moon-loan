import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Search, 
  UserPlus, 
  ArrowRight, 
  ShieldCheck, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Account } from '../../types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CustomerTransfers = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [recipientAccount, setRecipientAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [pin, setPin] = useState('');
  const [bankName, setBankName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [transferType, setTransferType] = useState<'internal' | 'local' | 'international'>('internal');
  const [currency, setCurrency] = useState('USD');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: Confirmation, 3: Success

  const currencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'HKD', 'NZD',
    'SEK', 'KRW', 'SGD', 'NOK', 'MXN', 'INR', 'RUB', 'ZAR', 'TRY', 'BRL',
    'TWD', 'DKK', 'PLN', 'THB', 'IDR', 'HUF', 'CZK', 'ILS', 'CLP', 'PHP',
    'AED', 'COP', 'SAR', 'MYR', 'RON', 'VND', 'KWD', 'QAR', 'EGP', 'NGN'
  ];

  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [isAddingBeneficiary, setIsAddingBeneficiary] = useState(false);
  const [newBeneficiary, setNewBeneficiary] = useState({ name: '', accountNumber: '', bankName: 'Moonstone Bank' });

  const fetchBeneficiaries = async () => {
    const res = await fetch('/api/customer/beneficiaries', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setBeneficiaries(data);
  };

  useEffect(() => {
    const fetchAccount = async () => {
      const res = await fetch('/api/customer/account', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAccount(data);
    };
    fetchAccount();
    fetchBeneficiaries();
  }, [token]);

  const handleAddBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customer/beneficiaries', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newBeneficiary)
      });
      if (res.ok) {
        toast.success('Beneficiary added');
        setIsAddingBeneficiary(false);
        setNewBeneficiary({ name: '', accountNumber: '', bankName: 'Moonstone Bank' });
        fetchBeneficiaries();
      }
    } catch (error) {
      toast.error('Failed to add beneficiary');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/customer/transfer', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          toAccountNumber: recipientAccount,
          amount: parseFloat(amount),
          description,
          pin,
          bankName: transferType === 'internal' ? 'Moonstone Bank' : bankName,
          recipientName,
          type: transferType,
          currency: transferType === 'international' ? currency : 'USD',
          swiftCode: transferType === 'international' ? swiftCode : undefined
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Transfer failed');

      setStep(3);
      toast.success('Transfer successful!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      navigate(-1);
    }
  };

  if (step === 3) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Transfer Successful!</h2>
          <p className="text-slate-600 mb-8">
            Your transfer of <span className="font-bold text-slate-900">${parseFloat(amount).toLocaleString()}</span> to account <span className="font-mono font-bold text-slate-900">{recipientAccount}</span> has been processed successfully.
          </p>
          <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Reference ID</span>
              <span className="font-mono font-bold text-slate-900">TXN-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Date & Time</span>
              <span className="font-bold text-slate-900">{new Date().toLocaleString()}</span>
            </div>
          </div>
          <button 
            onClick={() => {
              setStep(1);
              setAmount('');
              setRecipientAccount('');
              setDescription('');
              setPin('');
            }}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all"
          >
            Make Another Transfer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={handleBack}
          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
          title={step === 2 ? "Back to Form" : "Go Back"}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Send Money</h2>
          <p className="text-slate-500">Transfer funds securely {transferType === 'internal' ? 'to any Moonstone account' : 'to other banks'}</p>
        </div>
      </div>

      <div className="flex p-1 bg-slate-100 rounded-2xl w-full max-w-2xl">
        <button 
          onClick={() => { setTransferType('internal'); setStep(1); }}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${transferType === 'internal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Internal
        </button>
        <button 
          onClick={() => { setTransferType('local'); setStep(1); }}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${transferType === 'local' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Local Transfer
        </button>
        <button 
          onClick={() => { setTransferType('international'); setStep(1); }}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${transferType === 'international' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          International
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">From Account</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-slate-900">Savings Premium</p>
                  <p className="text-sm font-mono text-slate-500">{account?.account_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Balance</p>
                  <p className="text-xl font-bold text-slate-900">${account?.balance.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleTransfer} className="p-8 space-y-6">
              {step === 1 ? (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-slate-700">Recipient Name</label>
                      <input 
                        type="text" 
                        required
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Full name of recipient"
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-slate-700">Account Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input 
                          type="text" 
                          required
                          value={recipientAccount}
                          onChange={(e) => setRecipientAccount(e.target.value)}
                          placeholder="Recipient account number"
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {transferType !== 'internal' && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-slate-700">Bank Name</label>
                        <input 
                          type="text" 
                          required
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="Enter recipient's bank name"
                          className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                      </div>
                      {transferType === 'international' && (
                        <div className="space-y-4">
                          <label className="block text-sm font-bold text-slate-700">SWIFT / BIC Code</label>
                          <input 
                            type="text" 
                            required
                            value={swiftCode}
                            onChange={(e) => setSwiftCode(e.target.value.toUpperCase())}
                            placeholder="Enter SWIFT code"
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-slate-700">Amount to Transfer</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-slate-400 font-bold">$</span>
                        </div>
                        <input 
                          type="number" 
                          required
                          min="1"
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-lg"
                        />
                      </div>
                    </div>

                    {transferType === 'international' && (
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-slate-700">Currency</label>
                        <select 
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold"
                        >
                          {currencies.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Description (Optional)</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What's this for?"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all h-24 resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    Continue to Review
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <div className="space-y-8">
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                    <div className="flex gap-3">
                      <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-amber-900">Review {transferType.charAt(0).toUpperCase() + transferType.slice(1)} Transaction</p>
                        <p className="text-xs text-amber-700 mt-1">Please verify the recipient details before confirming. Transfers are irreversible.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between py-3 border-b border-slate-100">
                      <span className="text-slate-500">Recipient Name</span>
                      <span className="font-bold text-slate-900">{recipientName}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-slate-100">
                      <span className="text-slate-500">Recipient Account</span>
                      <span className="font-mono font-bold text-slate-900">{recipientAccount}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-slate-100">
                      <span className="text-slate-500">Bank Name</span>
                      <span className="font-bold text-slate-900">{transferType === 'internal' ? 'Moonstone Bank' : bankName}</span>
                    </div>
                    {transferType === 'international' && (
                      <div className="flex justify-between py-3 border-b border-slate-100">
                        <span className="text-slate-500">SWIFT Code</span>
                        <span className="font-mono font-bold text-slate-900">{swiftCode}</span>
                      </div>
                    )}
                    {transferType === 'international' && (
                      <div className="flex justify-between py-3 border-b border-slate-100">
                        <span className="text-slate-500">Currency</span>
                        <span className="font-bold text-slate-900">{currency}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-3 border-b border-slate-100">
                      <span className="text-slate-500">Amount</span>
                      <span className="font-bold text-slate-900">${parseFloat(amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-slate-100">
                      <span className="text-slate-500">Transfer Fee</span>
                      <span className="font-bold text-emerald-600">
                        {transferType === 'internal' ? '$0.00 (Free)' : transferType === 'local' ? '$5.00' : '$25.00'}
                      </span>
                    </div>
                    <div className="flex justify-between py-4 bg-slate-50 px-4 rounded-xl mt-2">
                      <span className="text-slate-700 font-bold">Total to be Debited</span>
                      <span className="font-bold text-slate-900 text-lg">
                        ${(parseFloat(amount) + (transferType === 'internal' ? 0 : transferType === 'local' ? 5 : 25)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Estimated Balance After</span>
                      <span>${((account?.balance || 0) - (parseFloat(amount) + (transferType === 'internal' ? 0 : transferType === 'local' ? 5 : 25))).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Enter Transaction PIN</label>
                    <input 
                      type="password" 
                      required
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="••••"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-center text-2xl tracking-[1em]"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                    >
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                        <>
                          <ShieldCheck className="h-5 w-5" />
                          Confirm Transfer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-600" />
                Saved Beneficiaries
              </div>
              <button 
                onClick={() => setIsAddingBeneficiary(!isAddingBeneficiary)}
                className="text-xs text-emerald-600 font-bold hover:underline"
              >
                {isAddingBeneficiary ? 'Cancel' : 'Add New'}
              </button>
            </h3>

            {isAddingBeneficiary ? (
              <form onSubmit={handleAddBeneficiary} className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <input 
                  type="text" 
                  placeholder="Full Name"
                  required
                  value={newBeneficiary.name}
                  onChange={(e) => setNewBeneficiary({...newBeneficiary, name: e.target.value})}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <input 
                  type="text" 
                  placeholder="Account Number"
                  required
                  value={newBeneficiary.accountNumber}
                  onChange={(e) => setNewBeneficiary({...newBeneficiary, accountNumber: e.target.value})}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button 
                  type="submit"
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all"
                >
                  Save Beneficiary
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                {beneficiaries.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No saved beneficiaries yet.
                  </p>
                ) : (
                  beneficiaries.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setRecipientAccount(b.account_number);
                        setStep(1);
                      }}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-100 rounded-2xl transition-all group"
                    >
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700">{b.name}</p>
                        <p className="text-[10px] font-mono text-slate-500">{b.account_number}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-all" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 text-white">
            <h3 className="font-bold mb-4">Security Tip</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Never share your transaction PIN or login credentials with anyone. 
              Moonstone Bank will never ask for your PIN via email or phone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerTransfers;
