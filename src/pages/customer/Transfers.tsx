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
  ArrowLeft,
  Printer,
  Copy,
  Share2,
  RefreshCw,
  Wallet,
  Globe,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Account } from '../../types';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

import { storageService } from '../../services/storage';

const CustomerTransfers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [recipientAccount, setRecipientAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [pin, setPin] = useState('');
  const [bankName, setBankName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [transferType, setTransferType] = useState<'local' | 'international'>('local');
  const [currency, setCurrency] = useState('USD');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<number>(1); // 1: Form, 2: Confirmation, 2.5: Processing, 3: Success
  const [countdown, setCountdown] = useState(30);
  const [countdownPhase, setCountdownPhase] = useState(1);
  const [generatedRef, setGeneratedRef] = useState('');
  const [generatedTime, setGeneratedTime] = useState('');

  const currencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'HKD', 'NZD',
    'SEK', 'KRW', 'SGD', 'NOK', 'MXN', 'INR', 'RUB', 'ZAR', 'TRY', 'BRL',
    'TWD', 'DKK', 'PLN', 'THB', 'IDR', 'HUF', 'CZK', 'ILS', 'CLP', 'PHP',
    'AED', 'COP', 'SAR', 'MYR', 'RON', 'VND', 'KWD', 'QAR', 'EGP', 'NGN'
  ];

  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [isAddingBeneficiary, setIsAddingBeneficiary] = useState(false);
  const [newBeneficiary, setNewBeneficiary] = useState({ name: '', accountNumber: '', bankName: 'ECONEST BANK' });

  const fetchBeneficiaries = async () => {
    if (!user) return;
    const data = await storageService.getBeneficiariesByUserId(user.id);
    setBeneficiaries(data);
  };

  useEffect(() => {
    const fetchAccount = async () => {
      if (!user) return;
      try {
        const data = await storageService.getAccountByUserId(user.id);
        if (data) setAccount(data);
      } catch (error) {
        console.error('Error fetching account:', error);
      }
    };

    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchAccount(), fetchBeneficiaries()]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [user]);

  const handleAddBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await storageService.saveBeneficiary({
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        name: newBeneficiary.name,
        accountNumber: newBeneficiary.accountNumber,
        bankName: newBeneficiary.bankName,
        createdAt: new Date().toISOString()
      });
      toast.success('Beneficiary added');
      setIsAddingBeneficiary(false);
      setNewBeneficiary({ name: '', accountNumber: '', bankName: 'ECONEST BANK' });
      await fetchBeneficiaries();
    } catch (error) {
      toast.error('Failed to add beneficiary');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !account) return;

    try {
      const transferAmount = parseFloat(amount);
      const fee = transferType === 'local' ? 5 : 25;
      const totalDebit = transferAmount + fee;

      if (account.balance < totalDebit) {
        throw new Error('INSUFFICIENT BALANCE');
      }

      const userPin = user?.transactionPin;
      if (!userPin) {
        throw new Error('TRANSFER PIN NOT SET. PLEASE CONTACT ADMIN.');
      }

      if (pin !== userPin) {
        throw new Error('INVALID TRANSFER PIN');
      }

      setIsLoading(true);

      const refId = `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const nowIso = new Date().toISOString();
      setGeneratedRef(refId);
      setGeneratedTime(nowIso);
      setCountdown(30);
      setCountdownPhase(1);
      setStep(2.5);
      toast.success('SECURE TRANSACTING CHANNEL ESTABLISHED (30s COOLDOWN ACTIVE)');
    } catch (error: any) {
      const message = error.message || 'Transfer failed';
      toast.error(message.toUpperCase());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2.5) {
      if (countdown > 0) {
        timer = setTimeout(() => {
          const nextVal = countdown - 1;
          setCountdown(nextVal);
          
          if (nextVal >= 24) setCountdownPhase(1);
          else if (nextVal >= 18) setCountdownPhase(2);
          else if (nextVal >= 12) setCountdownPhase(3);
          else if (nextVal >= 6) setCountdownPhase(4);
          else setCountdownPhase(5);
        }, 1000);
      } else {
        const finalizeTransaction = async () => {
          setIsLoading(true);
          try {
            const transferAmount = parseFloat(amount || "0");
            const fee = transferType === 'local' ? 5 : 25;
            const totalDebit = transferAmount + fee;

            if (account && user) {
              await storageService.saveAccount({
                ...account,
                balance: account.balance - totalDebit
              });

              await storageService.saveTransaction({
                id: Math.random().toString(36).substr(2, 9),
                accountId: account.id,
                userId: user.id,
                amount: transferAmount,
                type: 'debit',
                description: `Transfer to ${recipientName} (${recipientAccount})`,
                status: 'completed',
                reference_id: generatedRef,
                created_at: generatedTime
              });

              await storageService.saveNotification({
                id: Math.random().toString(36).substr(2, 9),
                userId: user.id,
                title: 'Funds Transferred Successfully',
                message: `Your transfer of $${transferAmount.toLocaleString()} to ${recipientName} (${recipientAccount}) was processed. Ref: ${generatedRef}`,
                type: 'transaction',
                isRead: false,
                createdAt: generatedTime
              });

              // Also trigger a refresh of account balance info in the background
              try {
                const refreshedData = await storageService.getAccountByUserId(user.id);
                if (refreshedData) setAccount(refreshedData);
              } catch (e) {
                // non-blocking
              }

              setStep(3);
              toast.success('TRANSFER COMPLETED SUCCESSFULLY!');
            }
          } catch (error: any) {
            console.error('Finalization failure:', error);
            toast.error('STATEMENT SAVING ERROR. PLEASE CONTACT SUPPORT.');
          } finally {
            setIsLoading(false);
          }
        };

        finalizeTransaction();
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [step, countdown, account, amount, transferType, generatedRef, generatedTime, recipientName, recipientAccount, user]);

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      navigate(-1);
    }
  };

  if (step === 2.5) {
    const progressPercent = Math.round(((30 - countdown) / 30) * 100);
    
    // Get phase message
    const getPhaseMessage = () => {
      switch (countdownPhase) {
        case 1:
          return {
            title: "Security Handshake",
            desc: "Registering secure gateway link and checking public encryption keys...",
            iconColor: "text-amber-500",
            bg: "bg-amber-500/10"
          };
        case 2:
          return {
            title: "Ledger Verification",
            desc: "Validating sufficient liquidity levels and confirming digital balance...",
            iconColor: "text-cyan-500",
            bg: "bg-cyan-500/10"
          };
        case 3:
          return {
            title: "Interbank Routing",
            desc: "Initiating secure SWIFT channel mapping and clearing house routing...",
            iconColor: "text-indigo-500",
            bg: "bg-indigo-500/10"
          };
        case 4:
          return {
            title: "Failsafe Ledger Sync",
            desc: "Recording double-sided transaction records onto decentralized vault ledger...",
            iconColor: "text-emerald-500",
            bg: "bg-emerald-500/10"
          };
        case 5:
        default:
          return {
            title: "Finalizing Certificates",
            desc: "Compiling certified digital security receipt and authorization signatures...",
            iconColor: "text-emerald-400 animate-pulse",
            bg: "bg-emerald-550/20 bg-emerald-500/20"
          };
      }
    };

    const phase = getPhaseMessage();

    return (
      <div className="max-w-md mx-auto py-12 px-4 min-h-[75vh] flex items-center justify-center animate-pulse duration-[3000ms]">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 w-full text-center space-y-8 relative overflow-hidden">
          {/* Subtle background animated accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-emerald-50 text-emerald-700 uppercase">
              🔒 Bank Grade Security Active
            </span>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Processing Transfer</h2>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider">Do not close this tab or navigate away</p>
          </div>

          {/* Majestic Circular Countdown Visual */}
          <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
            {/* Pulsing Backglow */}
            <div className="absolute inset-2 bg-emerald-50 rounded-full animate-ping opacity-25"></div>
            
            {/* SVG Circular Ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle 
                cx="80" 
                cy="80" 
                r="70" 
                className="text-slate-100" 
                strokeWidth="8" 
                stroke="currentColor" 
                fill="transparent" 
              />
              <circle
                cx="80" 
                cy="80" 
                r="70" 
                className="text-emerald-550 text-emerald-500 transition-all duration-1000 ease-out" 
                strokeWidth="8" 
                strokeDasharray="440" 
                strokeDashoffset={440 - (440 * progressPercent) / 100}
                strokeLinecap="round" 
                stroke="currentColor" 
                fill="transparent" 
              />
            </svg>
            
            {/* Center Timer Count */}
            <div className="absolute text-center">
              <span className="text-5xl font-black text-slate-950 font-mono tracking-tighter">
                {countdown}
              </span>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Seconds Left</p>
            </div>
          </div>

          {/* Checkbox checklist showing progress */}
          <div className="space-y-3 pt-2 text-left bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
            <div className="flex items-center gap-2.5 text-xs">
              <span className={`w-2 h-2 rounded-full ${countdown <= 24 ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-300'} transition-all`}></span>
              <span className={`font-semibold ${countdown <= 24 ? 'text-slate-800' : 'text-slate-400'}`}>1. Session Security Handshake</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <span className={`w-2 h-2 rounded-full ${countdown <= 18 ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-300'} transition-all`}></span>
              <span className={`font-semibold ${countdown <= 18 ? 'text-slate-800' : 'text-slate-400'}`}>2. Liquidity Verification Check</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <span className={`w-2 h-2 rounded-full ${countdown <= 12 ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-300'} transition-all`}></span>
              <span className={`font-semibold ${countdown <= 12 ? 'text-slate-800' : 'text-slate-400'}`}>3. Interbank Node Clearing</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <span className={`w-2 h-2 rounded-full ${countdown <= 6 ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-300'} transition-all`}></span>
              <span className={`font-semibold ${countdown <= 6 ? 'text-slate-800' : 'text-slate-400'}`}>4. Double-Sided Ledger Update</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <span className={`w-2 h-2 rounded-full ${countdown <= 0 ? 'bg-emerald-500 shadow-sm shadow-emerald-500/55' : 'bg-slate-300'} transition-all`}></span>
              <span className={`font-semibold ${countdown <= 0 ? 'text-slate-800' : 'text-slate-400'}`}>5. Receipt Verification Issuance</span>
            </div>
          </div>

          {/* Current Dynamic Phase Box */}
          <div className={`p-4 rounded-2xl ${phase.bg} border border-slate-100 transition-all duration-500`}>
            <p className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center justify-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
              {phase.title}
            </p>
            <p className="text-[11px] text-slate-600 mt-1 uppercase font-semibold leading-relaxed">
              {phase.desc}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    const transferAmount = parseFloat(amount || "0");
    const fee = transferType === 'local' ? 5 : 25;
    const totalDebit = transferAmount + fee;

    const copyReceiptToClipboard = () => {
      const textToCopy = `
========================================
       ECONEST BANK TRANSFER RECEIPT
========================================
Receipt Reference: ${generatedRef}
Date & Time: ${new Date(generatedTime).toLocaleString()}
Transaction Status: COMPLETED / SUCCESSFUL

DEBITED PARTY:
----------------------------------------
Sender Name: ${user?.fullName || user?.full_name || 'ECONEST CUSTOMER'}
Sender Account: ${account?.accountNumber || account?.account_number || 'N/A'}
Bank Name: ECONEST BANK

CREDITED PARTY:
----------------------------------------
Recipient Name: ${recipientName}
Recipient Account: ${recipientAccount}
Target Bank: ${bankName}
${transferType === 'international' ? `SWIFT/BIC Code: ${swiftCode}` : ''}

TRANSACTION VALUE DETAILS:
----------------------------------------
Transfer Amount: ${transferAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}
Processing Fee: $${fee.toFixed(2)} USD
Total Value Debited: $${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
Description: ${description || 'N/A'}
========================================
        Secured by ECONEST Ledger
========================================
`;
      navigator.clipboard.writeText(textToCopy);
      toast.success("Receipt details copied to clipboard!");
    };

    const handleShare = () => {
      if (navigator.share) {
        navigator.share({
          title: 'Econest Transfer Receipt',
          text: `Successful transfer of $${transferAmount.toLocaleString()} to ${recipientName}. Ref: ${generatedRef}`,
          url: window.location.href,
        }).catch(() => {
          copyReceiptToClipboard();
        });
      } else {
        copyReceiptToClipboard();
      }
    };

    return (
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
        {/* Style block specifically to manage printing layout of the receipt cleanly */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { 
              background: #ffffff !important; 
              color: #000000 !important;
            }
            header, footer, nav, aside, button, .no-print, .aside-menu { 
              display: none !important; 
            }
            .max-w-2xl {
              max-width: 100% !important;
              width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .shadow-xl, .shadow-2xl {
              box-shadow: none !important;
            }
            .border {
              border: 1px dashed #cbd5e1 !important;
            }
            #receipt-container {
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
              background: transparent !important;
            }
          }
        `}} />

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Receipt Generated</h2>
            <p className="text-xs text-slate-500 uppercase font-semibold">Your funds have been delivered safely</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              Print / Save PDF
            </button>
            <button
              onClick={copyReceiptToClipboard}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Copy className="h-4 w-4 text-slate-500" />
              Copy Advice
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-900/10"
            >
              <Share2 className="h-4 w-4 text-emerald-100" />
              Share
            </button>
          </div>
        </div>

        {/* Main Printable Receipt Card */}
        <div id="receipt-container" className="bg-slate-50/50 p-4 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          
          <div id="receipt-print-area" className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 md:p-8 space-y-8 relative max-w-xl mx-auto">
            {/* Top Cutout visual design */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

            {/* Econest Crest Branding Header */}
            <div className="flex justify-between items-start pt-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md">
                    <Check className="h-4 w-4 text-white font-bold" />
                  </div>
                  <span className="font-sans font-black tracking-widest text-base text-slate-900">ECONEST</span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Electronic Funds Advice Note</p>
              </div>
              <div className="text-right space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
                  <ShieldCheck className="h-3 w-3" />
                  Succeeded
                </span>
                <p className="text-[9px] text-slate-400 font-mono">ID: {generatedRef}</p>
              </div>
            </div>

            {/* Big Amount Stamp Banner */}
            <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-50 text-center py-6 px-4 rounded-2xl border border-emerald-100/40 relative">
              {/* Decorative Verified Watermark stamp */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none opacity-[0.06] text-emerald-800 rotate-12">
                <ShieldCheck className="h-28 w-28" />
              </div>
              <p className="text-[10px] text-emerald-700 uppercase font-black tracking-widest mb-1">Delivered Amount</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-sm font-bold text-emerald-600">{currency}</span>
                <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
                  ${transferAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-wide">
                Processed via secure instant clearing tunnel
              </p>
            </div>

            {/* Parties Detailed Mapping (Sender vs Beneficiary) */}
            <div className="grid md:grid-cols-2 gap-6 pt-2">
              {/* Origin Section */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100/80">
                <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200/60">
                  <Wallet className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Debit Party (Origin)</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Sender Name</p>
                  <p className="font-bold text-slate-800">{user?.fullName || user?.full_name || 'ECONEST CUSTOMER'}</p>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Account Number</p>
                  <p className="font-mono text-xs font-bold text-slate-700">
                    {account?.accountNumber || account?.account_number}
                  </p>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Institution</p>
                  <p className="font-semibold text-slate-600 text-xs">ECONEST BANK</p>
                </div>
              </div>

              {/* Destination Section */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100/80">
                <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200/60">
                  <Globe className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Credit Party (Beneficiary)</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Recipient Name</p>
                  <p className="font-bold text-slate-800">{recipientName}</p>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Account Number</p>
                  <p className="font-mono text-xs font-bold text-slate-700">{recipientAccount}</p>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Destination Bank</p>
                  <p className="font-semibold text-slate-600 text-xs uppercase">{bankName}</p>
                </div>
                {transferType === 'international' && swiftCode && (
                  <div className="space-y-1 text-sm pt-0.5">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">SWIFT / BIC</p>
                    <p className="font-mono text-xs font-bold text-slate-700">{swiftCode}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Detailed Breakdown */}
            <div className="border-t border-dashed border-slate-200 pt-6 space-y-3.5">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Value Settlement Breakdown</p>
              
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500">Principal Ledger Value</span>
                <span className="font-semibold text-slate-900">
                  ${transferAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                </span>
              </div>

              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500">Handshake Clearance Surcharge</span>
                <span className="font-semibold text-emerald-600">${fee.toFixed(2)} USD</span>
              </div>

              {description && (
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500">Memo / Description</span>
                  <span className="font-semibold text-slate-700 truncate max-w-xs">{description}</span>
                </div>
              )}

              <div className="border-t border-slate-100 my-2 pt-2 flex justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Total Volume Debited</span>
                <span className="text-base font-black text-slate-900 font-mono">
                  ${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                </span>
              </div>
            </div>

            {/* Secure Procedural Authentic Barcode Layout */}
            <div className="border-t border-dashed border-slate-200 pt-6 space-y-4 text-center">
              <div className="flex items-center justify-center gap-[1px] h-12 w-full max-w-xs mx-auto overflow-hidden bg-white px-2">
                {[
                  3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4, 6, 2, 6, 4, 3, 3, 8, 3, 2, 7, 9,
                  5, 0, 2, 8, 8, 4, 1, 9, 7, 1, 6, 9, 3, 9, 9, 3, 7, 5, 1, 0, 5, 8, 2, 0, 9, 7, 4, 9, 4, 4, 5
                ].map((val, idx) => {
                  let widthClass = "w-[1px]";
                  if (val % 4 === 1) widthClass = "w-[2px]";
                  else if (val % 4 === 2) widthClass = "w-[3px]";
                  else if (val % 4 === 3) widthClass = "w-[4px]";
                  
                  // Vary heights to make it look organic
                  const heightClass = val % 5 === 0 ? "h-10" : "h-12";
                  
                  return (
                    <div 
                      key={idx} 
                      className={`${widthClass} ${heightClass} bg-slate-850 bg-slate-800`} 
                    />
                  );
                })}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-slate-700">
                  {generatedRef}-{Math.floor(10000 + Math.random() * 90000)}
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Secured by Econest Ledger Integrity System
                </div>
                <p className="text-[9px] text-slate-400 italic font-mono pt-1">
                  Advice certified by general ledger timestamp: {new Date(generatedTime).toUTCString()}
                </p>
              </div>
            </div>
            
          </div>
        </div>

        {/* Finish / Next Action Button */}
        <div className="no-print pt-4">
          <button
            onClick={() => {
              // Reset transfer states completely to restart
              setStep(1);
              setAmount('');
              setRecipientAccount('');
              setDescription('');
              setPin('');
              setBankName('');
              setRecipientName('');
              setSwiftCode('');
              setGeneratedRef('');
              setGeneratedTime('');
            }}
            className="w-full py-4 bg-slate-900 border border-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 hover:border-slate-800 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4 animate-spin-hover" />
            Make Another Payment / Transfer
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
          <p className="text-slate-500">Transfer funds securely to other banks</p>
      </div>
    </div>

    <div className="flex p-1 bg-slate-100 rounded-2xl w-full max-w-2xl">
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

      {!user?.transactionPin && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4 items-center">
          <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900 uppercase">TRANSFER PIN NOT SET</p>
            <p className="text-xs text-amber-700 mt-1 uppercase">YOUR TRANSFER PIN IS NOT SET. PLEASE CONTACT THE BANK ADMINISTRATOR TO SET YOUR PIN BEFORE YOU CAN MAKE ANY TRANSFERS.</p>
          </div>
        </div>
      )}

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
                  <p className="text-lg font-bold text-slate-900">ECONEST Premium</p>
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

                  {/* Bank Name always required since internal is removed */}
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
                        <p className="text-sm font-bold text-amber-900 uppercase">REVIEW {transferType.toUpperCase()} TRANSACTION</p>
                        <p className="text-xs text-amber-700 mt-1 uppercase">PLEASE VERIFY THE RECIPIENT DETAILS BEFORE CONFIRMING. TRANSFERS ARE IRREVERSIBLE.</p>
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
                      <span className="font-bold text-slate-900">{bankName}</span>
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
                        {transferType === 'local' ? '$5.00' : '$25.00'}
                      </span>
                    </div>
                    <div className="flex justify-between py-4 bg-slate-50 px-4 rounded-xl mt-2">
                      <span className="text-slate-700 font-bold">Total to be Debited</span>
                      <span className="font-bold text-slate-900 text-lg">
                        ${(parseFloat(amount) + (transferType === 'local' ? 5 : 25)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Estimated Balance After</span>
                      <span>${((account?.balance || 0) - (parseFloat(amount) + (transferType === 'local' ? 5 : 25))).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-tight">
                      FINAL TRANSFER PIN NEEDED TO HAVE A SUCCESSFUL TRANSFER
                    </label>
                    <input 
                      type="password" 
                      required
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="****"
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono text-center text-2xl tracking-widest"
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
                          <Send className="h-5 w-5" />
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
              ECONEST BANK will never ask for your PIN via email or phone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerTransfers;
