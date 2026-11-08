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
  Check,
  Mail,
  Layers,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  FileCheck,
  Landmark,
  X,
  Coins,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Account, FeeReason, TransferScreenConfig } from '../../types';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

import { storageService } from '../../services/storage';
import { emailService } from '../../services/emailService';
import { DEFAULT_FEE_REASONS, DEFAULT_TRANSFER_SCREEN_CONFIG } from '../../services/bankConfig';
import { WORLD_CURRENCIES, CountryCurrency } from '../../data/currencies';

const CustomerTransfers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [recipientAccount, setRecipientAccount] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [feeNoticeExpanded, setFeeNoticeExpanded] = useState(true);
  const [feeProofSubmitted, setFeeProofSubmitted] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [pin, setPin] = useState('');
  const [bankName, setBankName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [transferType, setTransferType] = useState<'local' | 'international'>('local');
  const [currency, setCurrency] = useState('USD');
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<number>(1); // 1: Form, 2: Confirmation, 2.5: Processing, 3: Success
  const [countdown, setCountdown] = useState(30);
  const [countdownPhase, setCountdownPhase] = useState(1);
  const [generatedRef, setGeneratedRef] = useState('');
  const [generatedTime, setGeneratedTime] = useState('');

  const selectedCurr = WORLD_CURRENCIES.find(c => c.code === currency) || WORLD_CURRENCIES[0];

  const filteredCurrencies = WORLD_CURRENCIES.filter(c => {
    const q = currencySearch.toLowerCase().trim();
    if (!q) return true;
    return (
      c.code.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
    );
  });

  // Admin Configurable Fee & Screen Settings
  const [feeEnabled, setFeeEnabled] = useState(true);
  const [feeReasons, setFeeReasons] = useState<FeeReason[]>(DEFAULT_FEE_REASONS);
  const [transferScreenConfig, setTransferScreenConfig] = useState<TransferScreenConfig>(DEFAULT_TRANSFER_SCREEN_CONFIG);

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

    const fetchSettings = async () => {
      try {
        const data = await storageService.getSettings();
        if (data) {
          if (data.fee_enabled !== undefined) {
            setFeeEnabled(Boolean(data.fee_enabled));
          }
          if (data.fee_reasons) {
            try {
              const parsed = typeof data.fee_reasons === 'string' ? JSON.parse(data.fee_reasons) : data.fee_reasons;
              if (Array.isArray(parsed) && parsed.length > 0) setFeeReasons(parsed);
            } catch (e) {}
          }
          if (data.transfer_screen_config) {
            try {
              const parsed = typeof data.transfer_screen_config === 'string' ? JSON.parse(data.transfer_screen_config) : data.transfer_screen_config;
              if (parsed && typeof parsed === 'object') {
                setTransferScreenConfig(prev => ({
                  ...prev,
                  ...parsed,
                  showReceiverEmailInTransfer: parsed.showReceiverEmailInTransfer !== undefined
                    ? Boolean(parsed.showReceiverEmailInTransfer)
                    : false,
                  singleFeeAtATime: parsed.singleFeeAtATime !== undefined
                    ? Boolean(parsed.singleFeeAtATime)
                    : true
                }));
              }
            } catch (e) {}
          }
        }
      } catch (e) {
        console.warn('Could not load transfer settings:', e);
      }
    };

    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchAccount(), fetchBeneficiaries(), fetchSettings()]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [user]);

  // Calculate dynamic active transfer fee
  const activeReasons = feeReasons.filter(r => r.isEnabled);
  const calculatedFee = feeEnabled 
    ? (activeReasons.length > 0 
        ? activeReasons.reduce((sum, r) => sum + r.amount, 0) 
        : (transferType === 'local' ? 5 : 25))
    : 0;

  const feeReasonLabel = feeEnabled
    ? (activeReasons.length > 0 
        ? activeReasons.map(r => r.name).join(' + ') 
        : (transferType === 'local' ? 'Standard Clearance Fee' : 'International Wire Fee'))
    : 'Fee Waived ($0.00 Promo)';

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
      const rawAmount = parseFloat(amount || "0");
      const rate = selectedCurr.rateToUsd || 1;
      const transferAmountInUsd = transferType === 'international' && currency !== 'USD' ? (rawAmount * rate) : rawAmount;
      const fee = calculatedFee;
      const totalDebit = transferAmountInUsd + fee;

      if (account.balance < totalDebit) {
        throw new Error(`INSUFFICIENT BALANCE (Required: $${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD)`);
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
            const rawAmount = parseFloat(amount || "0");
            const transferAmount = rawAmount;
            const rate = selectedCurr.rateToUsd || 1;
            const transferAmountInUsd = transferType === 'international' && currency !== 'USD' ? (rawAmount * rate) : rawAmount;
            const fee = calculatedFee;
            const totalDebit = transferAmountInUsd + fee;

            if (account && user) {
              await storageService.saveAccount({
                ...account,
                balance: account.balance - totalDebit
              });

              await storageService.saveTransaction({
                id: Math.random().toString(36).substr(2, 9),
                accountId: account.id,
                userId: user.id,
                senderEmail: user.email,
                recipientName,
                recipientAccount,
                recipientEmail: recipientEmail.trim(),
                bankName: bankName || 'ECONEST BANK',
                amount: rawAmount,
                fee: calculatedFee,
                feeReason: feeReasonLabel,
                transferType,
                type: 'debit',
                description: description || `${transferType === 'international' ? 'International SWIFT Wire' : 'Domestic Clearance Wire'} to ${recipientName} (${selectedCurr.country})`,
                status: 'completed',
                referenceId: generatedRef,
                created_at: generatedTime
              });

              await storageService.saveNotification({
                id: Math.random().toString(36).substr(2, 9),
                userId: user.id,
                title: 'Funds Transferred Successfully',
                message: `Your transfer of $${transferAmount.toLocaleString()} to ${recipientName} (${recipientAccount}) was processed. Fee: $${fee.toFixed(2)} (${feeReasonLabel}). Ref: ${generatedRef}`,
                type: 'transaction',
                isRead: false,
                createdAt: generatedTime
              });

              // Dispatch real SMTP email alert to Admin, Customer & Receiver!
              emailService.sendTransferEmail({
                senderEmail: user.email,
                senderName: user.fullName || user.full_name || 'Valued Customer',
                senderAccount: account.accountNumber || account.account_number || 'N/A',
                recipientName,
                recipientAccount,
                recipientEmail: recipientEmail.trim(),
                bankName: bankName || 'ECONEST BANK',
                amount: transferAmount,
                currency,
                fee: calculatedFee,
                feeReason: feeReasonLabel,
                referenceId: generatedRef,
                timestamp: generatedTime,
                description
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
  }, [step, countdown, account, amount, transferType, generatedRef, generatedTime, recipientName, recipientAccount, user, calculatedFee, feeReasonLabel, currency, description, bankName]);

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
    const rate = selectedCurr.rateToUsd || 1;
    const transferAmountInUsd = transferType === 'international' && currency !== 'USD' ? (transferAmount * rate) : transferAmount;
    const fee = calculatedFee;
    const totalDebit = transferAmountInUsd + fee;

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

        {/* Action Header with Admin Custom Title and Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {transferScreenConfig.successTitle || 'Receipt Generated'}
            </h2>
            <p className="text-xs text-slate-500 uppercase font-semibold">
              {transferScreenConfig.successSubtitle || 'Your funds have been delivered safely'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {transferScreenConfig.showPrintButton && (
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="h-4 w-4 text-slate-500" />
                Print / Save PDF
              </button>
            )}
            <button
              onClick={copyReceiptToClipboard}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Copy className="h-4 w-4 text-slate-500" />
              Copy Advice
            </button>
            {transferScreenConfig.showShareButton && (
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-900/10"
              >
                <Share2 className="h-4 w-4 text-emerald-100" />
                Share
              </button>
            )}
          </div>
        </div>

        {/* Admin Customized Notice Banner */}
        {transferScreenConfig.noticeBannerText && (
          <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-medium leading-relaxed shadow-xs no-print ${
            transferScreenConfig.noticeBannerType === 'warning'
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : transferScreenConfig.noticeBannerType === 'info'
              ? 'bg-sky-50 text-sky-900 border-sky-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
          }`}>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
              <div>{transferScreenConfig.noticeBannerText}</div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ADMIN CUSTOM FEE PAYMENT MESSAGE (ON/OFF - SINGLE OR MULTIPLE) */}
        {/* ============================================================== */}
        {transferScreenConfig.feePaymentMessageEnabled && (
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-5 sm:p-7 border-2 border-amber-500/30 shadow-2xl space-y-5 no-print relative overflow-hidden">
            {/* Subtle amber accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400"></div>

            {/* Header with Title and Mode Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                      Official Clearance Directive
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                      {transferScreenConfig.feePaymentMode === 'multiple' ? 'Sequential Multi-Stage Fee' : 'Single Clearance Fee'}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white tracking-tight mt-0.5">
                    Mandatory Settlement Fee Payment Required
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setFeeNoticeExpanded(!feeNoticeExpanded)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700"
                >
                  {feeNoticeExpanded ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" />
                      <span>Collapse</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" />
                      <span>View Fee Requirements</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {feeNoticeExpanded && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* MODE 1: SINGLE PAYMENT */}
                {transferScreenConfig.feePaymentMode === 'single' ? (
                  <div className="bg-slate-800/70 rounded-2xl p-5 border border-slate-700/80 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-700/60">
                      <div>
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">One-Time Settlement Fee</span>
                        <h4 className="text-base font-bold text-white">
                          {transferScreenConfig.singleFeeMessage?.title || 'Mandatory Regulatory Settlement Fee'}
                        </h4>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Required Amount</span>
                        <span className="text-2xl font-black text-amber-400 font-mono">
                          ${Number(transferScreenConfig.singleFeeMessage?.amount || 350).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {transferScreenConfig.singleFeeMessage?.description || 'Federal regulatory clearance fee must be remitted before outgoing funds are permanently credited.'}
                    </p>

                    {transferScreenConfig.singleFeeMessage?.instructions && (
                      <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-700/70 text-xs text-slate-300 space-y-1">
                        <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                          Payment & Remittance Instructions:
                        </span>
                        <p className="leading-relaxed pl-4">
                          {transferScreenConfig.singleFeeMessage?.instructions}
                        </p>
                      </div>
                    )}

                    {/* Escrow Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Designated Escrow Account</span>
                        <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm">
                          {transferScreenConfig.singleFeeMessage?.accountNumber || 'ESC-8849-0192-EC'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Clearing Institution</span>
                        <span className="font-bold text-white text-xs sm:text-sm">
                          {transferScreenConfig.singleFeeMessage?.bankName || 'ECONEST Escrow Clearance Bank'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Clearing Routing Code</span>
                        <span className="font-mono font-bold text-amber-300 text-xs sm:text-sm">
                          {transferScreenConfig.singleFeeMessage?.routingCode || 'ECNTUS33CLR'}
                        </span>
                      </div>
                    </div>

                    {transferScreenConfig.singleFeeMessage?.urgencyText && (
                      <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 px-3.5 py-2.5 rounded-xl border border-amber-500/20 font-semibold">
                        <Clock className="h-4 w-4 shrink-0 text-amber-400" />
                        <span>{transferScreenConfig.singleFeeMessage?.urgencyText}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* MODE 2: SEQUENTIAL STAGES (ONLY SINGLE FEE COMES AT A TIME) */
                  <div className="space-y-4">
                    {(() => {
                      const stages = transferScreenConfig.multipleFeeStages || [];
                      const activeStage = stages[0];
                      if (!activeStage) return null;

                      return (
                        <>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                                  Settlement Protocol • Step {activeStage.stageNumber || 1} of {stages.length}
                                </span>
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30 uppercase">
                                  Active Surcharge
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 mt-0.5">
                                Mandatory clearance requirement: Settle this active single fee to progress settlement.
                              </p>
                            </div>
                            <div className="text-left sm:text-right">
                              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Active Amount Due</span>
                              <span className="text-xl font-black text-amber-400 font-mono">
                                ${Number(activeStage.amount).toFixed(2)} USD
                              </span>
                            </div>
                          </div>

                          {/* ONLY SINGLE ACTIVE FEE CARD APPEARS */}
                          <div 
                            key={activeStage.id || 0}
                            className="bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-amber-500/30 space-y-3 relative overflow-hidden transition-all shadow-lg shadow-black/20"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                                  {activeStage.stageNumber || 1}
                                </span>
                                <div>
                                  <span className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider">
                                    Current Payment Step {activeStage.stageNumber || 1} of {stages.length}
                                  </span>
                                  <h4 className="text-sm sm:text-base font-bold text-white">
                                    {activeStage.title}
                                  </h4>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-auto pl-11 sm:pl-0">
                                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  {activeStage.statusText || 'Required - Step 1'}
                                </span>
                                <span className="text-base sm:text-lg font-black text-amber-400 font-mono">
                                  ${Number(activeStage.amount).toFixed(2)} USD
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed pl-11 sm:pl-0">
                              {activeStage.description}
                            </p>

                            {activeStage.instructions && (
                              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-700/70 text-xs text-slate-300 pl-11 sm:pl-3">
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-0.5">
                                  Instructions for this payment:
                                </span>
                                <p className="leading-relaxed">{activeStage.instructions}</p>
                              </div>
                            )}

                            {(activeStage.requiredAccount || activeStage.requiredBank) && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/80">
                                <div>
                                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Escrow Ledger for Step {activeStage.stageNumber || 1}</span>
                                  <span className="font-mono font-bold text-emerald-400 text-xs">
                                    {activeStage.requiredAccount || 'ESC-CLEAR-9901'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Clearance Vault</span>
                                  <span className="font-bold text-slate-200 text-xs">
                                    {activeStage.requiredBank || 'ECONEST Clearance Bureau'}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Consecutive Order Protection Notice: Next steps locked */}
                            <div className="flex items-center gap-2 text-[11px] text-amber-300/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                              <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                              <span>
                                Single-Fee Clearance Protocol: Only this payment requirement is active right now. Subsequent clearance steps (if required) will only be unlocked after Step {activeStage.stageNumber || 1} has been certified.
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Actions & Proof Notification */}
                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Clearance verification is monitored 24/7 by Treasury Control</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        const copyText = transferScreenConfig.feePaymentMode === 'single'
                          ? `FEE CLEARANCE INSTRUCTIONS:\nTitle: ${transferScreenConfig.singleFeeMessage?.title}\nAmount: $${transferScreenConfig.singleFeeMessage?.amount} USD\nEscrow Account: ${transferScreenConfig.singleFeeMessage?.accountNumber}\nBank: ${transferScreenConfig.singleFeeMessage?.bankName}\nRouting: ${transferScreenConfig.singleFeeMessage?.routingCode}\nInstructions: ${transferScreenConfig.singleFeeMessage?.instructions}`
                          : `SEQUENTIAL FEE CLEARANCE INSTRUCTIONS:\n${(transferScreenConfig.multipleFeeStages || []).map(s => `Step ${s.stageNumber}: ${s.title} ($${s.amount} USD) - Ledger: ${s.requiredAccount}`).join('\n')}`;
                        navigator.clipboard.writeText(copyText);
                        toast.success('Fee clearance instructions copied to clipboard!');
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-700 flex-1 sm:flex-initial"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Fee Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFeeProofSubmitted(true);
                        toast.success('Treasury notified: Your fee payment advice has been logged for priority verification!');
                      }}
                      disabled={feeProofSubmitted}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md flex-1 sm:flex-initial ${
                        feeProofSubmitted
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-amber-500/20'
                      }`}
                    >
                      {feeProofSubmitted ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Fee Advice Submitted</span>
                        </>
                      ) : (
                        <>
                          <FileCheck className="h-3.5 w-3.5" />
                          <span>I Have Sent Fee / Notify Admin</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
                {recipientEmail && (
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Receiver Email (Direct Correspondence)</p>
                    <p className="font-mono text-xs font-bold text-indigo-700">{recipientEmail}</p>
                  </div>
                )}
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

              {transferScreenConfig.showFeeBreakdown && (
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500">
                    {feeEnabled ? `Clearing Surcharge (${feeReasonLabel})` : 'Transfer Fee'}
                  </span>
                  <span className="font-semibold text-emerald-600">
                    {feeEnabled ? `$${fee.toFixed(2)} USD` : 'WAIVED ($0.00)'}
                  </span>
                </div>
              )}

              {description && (
                <div className="flex justify-between text-xs font-medium gap-3">
                  <span className="text-slate-500 shrink-0">Memo / Description</span>
                  <span className="font-semibold text-slate-700 text-right break-words max-w-[220px]">{description}</span>
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
              setRecipientEmail('');
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

    {/* Transfer Type Selection - Designed with Distinct Vibrant Themes */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-3xl">
      {/* 1. Local Transfer Option - Vibrant Emerald & Teal Theme */}
      <button 
        type="button"
        onClick={() => { setTransferType('local'); setStep(1); }}
        className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left flex items-center justify-between group cursor-pointer ${
          transferType === 'local' 
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white border-emerald-400 shadow-lg shadow-emerald-950/20 ring-2 ring-emerald-500/20 scale-[1.01]' 
            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
            transferType === 'local' 
              ? 'bg-white/20 text-white shadow-inner' 
              : 'bg-emerald-100/80 text-emerald-700 group-hover:bg-emerald-200'
          }`}>
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-base font-black tracking-tight ${transferType === 'local' ? 'text-white' : 'text-slate-900'}`}>
                Local Transfer
              </span>
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                transferType === 'local' 
                  ? 'bg-emerald-950/40 text-emerald-200 border border-emerald-300/30' 
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                Domestic Rail
              </span>
            </div>
            <p className={`text-xs mt-0.5 font-medium ${transferType === 'local' ? 'text-emerald-100' : 'text-slate-500'}`}>
              Instant Clearing • 0% Fee
            </p>
          </div>
        </div>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
          transferType === 'local' ? 'bg-white text-emerald-700 shadow-sm' : 'border-2 border-slate-300 text-transparent'
        }`}>
          <Check className="h-3.5 w-3.5 stroke-[3]" />
        </div>
      </button>

      {/* 2. International Transfer Option - Royal Indigo, Electric Blue & Cyan Theme */}
      <button 
        type="button"
        onClick={() => { setTransferType('international'); setStep(1); }}
        className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left flex items-center justify-between group cursor-pointer ${
          transferType === 'international' 
            ? 'bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-600 text-white border-cyan-400 shadow-lg shadow-indigo-950/20 ring-2 ring-cyan-500/20 scale-[1.01]' 
            : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
            transferType === 'international' 
              ? 'bg-white/20 text-white shadow-inner' 
              : 'bg-indigo-100/80 text-indigo-700 group-hover:bg-indigo-200'
          }`}>
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-base font-black tracking-tight ${transferType === 'international' ? 'text-white' : 'text-slate-900'}`}>
                International
              </span>
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                transferType === 'international' 
                  ? 'bg-indigo-950/40 text-cyan-200 border border-cyan-300/30' 
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}>
                150+ Countries
              </span>
            </div>
            <p className={`text-xs mt-0.5 font-medium ${transferType === 'international' ? 'text-cyan-100' : 'text-slate-500'}`}>
              Global SWIFT &amp; Multi-Currency Wire
            </p>
          </div>
        </div>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
          transferType === 'international' ? 'bg-white text-indigo-700 shadow-sm' : 'border-2 border-slate-300 text-transparent'
        }`}>
          <Check className="h-3.5 w-3.5 stroke-[3]" />
        </div>
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
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider">From Account</span>
                <span className="text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">Active</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-base sm:text-lg font-black text-slate-900 truncate">ECONEST Premium</p>
                  <p className="text-xs sm:text-sm font-mono text-slate-500">{account?.account_number}</p>
                </div>
                <div className="text-left sm:text-right flex items-baseline sm:flex-col justify-between sm:justify-start gap-1 pt-1 sm:pt-0 border-t sm:border-0 border-slate-200/60">
                  <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-bold">Available Balance</span>
                  <p className="text-lg sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                    ${account?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleTransfer} className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
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

                  {/* Bank Name & Receiver Email Address */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-slate-700">Destination Bank Name *</label>
                      <input 
                        type="text" 
                        required
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Enter recipient's bank name"
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-bold text-slate-700">
                          Receiver Email Address *
                        </label>
                        <span className="text-[10px] font-bold text-indigo-700 uppercase bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                          Direct Correspondence
                        </span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-slate-400" />
                        </div>
                        <input 
                          type="email" 
                          required
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          placeholder="recipient@gmail.com"
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono text-sm"
                        />
                      </div>
                    </div>
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

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-bold text-slate-700">Amount to Transfer</label>
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                          Min: {selectedCurr.symbol}1.00
                        </span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-slate-500 font-black text-lg">{selectedCurr.symbol || '$'}</span>
                        </div>
                        <input 
                          type="number" 
                          required
                          min="1"
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-12 pr-16 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-lg font-mono"
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <span className="text-xs font-mono font-bold text-slate-400 uppercase">{currency}</span>
                        </div>
                      </div>

                      {/* Real-time USD conversion estimate for non-USD currencies */}
                      {currency !== 'USD' && amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
                        <div className="p-3 bg-indigo-50/80 border border-indigo-200/70 rounded-2xl flex items-center justify-between text-xs font-medium text-indigo-950 animate-fade-in">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{selectedCurr.flag}</span>
                            <span>Principal Value in USD:</span>
                            <strong className="font-mono font-black text-slate-900">
                              ${(Number(amount) * (selectedCurr.rateToUsd || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                            </strong>
                          </div>
                          <span className="text-[10px] text-indigo-700 font-mono font-bold bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
                            1 {selectedCurr.code} ≈ ${(selectedCurr.rateToUsd || 1).toFixed(4)} USD
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 150+ Countries Currency Selector Trigger */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-bold text-slate-700">
                          Transfer Currency ({transferType === 'international' ? '150+ Countries' : 'Standard'})
                        </label>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          transferType === 'international'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {selectedCurr.country}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsCurrencyModalOpen(true)}
                        className={`w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100/90 border-2 rounded-2xl flex items-center justify-between transition-all group shadow-2xs cursor-pointer ${
                          transferType === 'international'
                            ? 'border-indigo-200 hover:border-indigo-500'
                            : 'border-emerald-200 hover:border-emerald-500'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-3xl flex-shrink-0">{selectedCurr.flag}</span>
                          <div className="text-left min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-slate-900 text-base">{selectedCurr.code}</span>
                              <span className="text-xs font-bold text-slate-500">({selectedCurr.symbol})</span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium break-words leading-tight">
                              {selectedCurr.name} • {selectedCurr.country}
                            </p>
                          </div>
                        </div>

                        <div className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                          transferType === 'international'
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                            : 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        }`}>
                          <span>150+ Countries</span>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </div>
                      </button>
                    </div>
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
                      <span className="text-slate-500">Receiver Email</span>
                      <span className="font-mono font-bold text-indigo-600">{recipientEmail || 'Not provided'}</span>
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
                    <div className="flex justify-between py-3 border-b border-slate-100">
                      <span className="text-slate-500">Destination Currency</span>
                      <span className="font-bold text-slate-900 flex items-center gap-2 flex-wrap justify-end text-right">
                        <span className="text-xl shrink-0">{selectedCurr.flag}</span>
                        <span>{selectedCurr.code} ({selectedCurr.symbol})</span>
                        <span className="text-xs text-slate-400 font-normal break-words">({selectedCurr.country})</span>
                      </span>
                    </div>

                    <div className="flex justify-between py-3 border-b border-slate-100">
                      <span className="text-slate-500">Transfer Principal</span>
                      <span className="font-mono font-bold text-slate-900">
                        {selectedCurr.symbol}{parseFloat(amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                        {transferType === 'international' && currency !== 'USD' && (
                          <span className="text-xs text-slate-500 font-normal ml-2">
                            (≈ ${((parseFloat(amount || '0')) * (selectedCurr.rateToUsd || 1)).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-slate-100">
                      <div>
                        <span className="text-slate-500">Transfer Fee</span>
                        {feeEnabled && (
                          <p className="text-[10px] text-slate-400 font-medium">{feeReasonLabel}</p>
                        )}
                      </div>
                      <span className="font-bold text-emerald-600">
                        {feeEnabled ? `$${calculatedFee.toFixed(2)} USD` : 'FREE ($0.00)'}
                      </span>
                    </div>
                    <div className="flex justify-between py-4 bg-slate-50 px-4 rounded-xl mt-2">
                      <span className="text-slate-700 font-bold">Total USD Debited</span>
                      <span className="font-bold text-slate-900 text-lg font-mono">
                        ${(((parseFloat(amount || '0')) * (transferType === 'international' && currency !== 'USD' ? (selectedCurr.rateToUsd || 1) : 1)) + calculatedFee).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                      </span>
                    </div>
                    <div className="flex justify-between px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Estimated Balance After</span>
                      <span className="font-mono">${((account?.balance || 0) - (((parseFloat(amount || '0')) * (transferType === 'international' && currency !== 'USD' ? (selectedCurr.rateToUsd || 1) : 1)) + calculatedFee)).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
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

        <div className="space-y-6 sm:space-y-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200 shadow-sm">
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

          <div className="bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 text-white">
            <h3 className="font-bold mb-4">Security Tip</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Never share your transaction PIN or login credentials with anyone. 
              ECONEST BANK will never ask for your PIN via email or phone.
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 150+ COUNTRIES & GLOBAL CURRENCIES SEARCHABLE SELECTOR MODAL */}
      {/* ============================================================== */}
      {isCurrencyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">Select Transfer Currency</h3>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      {WORLD_CURRENCIES.length} Sovereign Jurisdictions
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Deliver funds to counterparties in local legal tender across 150+ countries.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsCurrencyModalOpen(false); setCurrencySearch(''); }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="p-4 border-b border-slate-100 bg-white space-y-3">
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  value={currencySearch}
                  onChange={(e) => setCurrencySearch(e.target.value)}
                  placeholder="Search country, currency code, or name (e.g. Canada, Euro, CAD, Japan, Peso)..."
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                />
                {currencySearch && (
                  <button
                    type="button"
                    onClick={() => setCurrencySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Popular Quick-Select Chips */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Major Global Currencies</p>
                <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
                  {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY', 'AED', 'SAR', 'SGD', 'BRL', 'NGN', 'INR', 'ZAR', 'MXN'].map((code) => {
                    const item = WORLD_CURRENCIES.find(c => c.code === code);
                    if (!item) return null;
                    const isSelected = currency === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => {
                          setCurrency(code);
                          setIsCurrencyModalOpen(false);
                          setCurrencySearch('');
                          toast.success(`Selected ${item.country} (${code})`);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm scale-105'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200/80'
                        }`}
                      >
                        <span>{item.flag}</span>
                        <span className="font-mono">{code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Scrollable Currencies Grid / List */}
            <div className="p-4 overflow-y-auto flex-1 max-h-[50vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredCurrencies.map((c) => {
                  const isSelected = currency === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setCurrency(c.code);
                        setIsCurrencyModalOpen(false);
                        setCurrencySearch('');
                        toast.success(`Selected ${c.country} (${c.code})`);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl flex-shrink-0">{c.flag}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-slate-900 text-sm">{c.code}</span>
                            <span className="text-xs text-slate-400 font-semibold">({c.symbol})</span>
                          </div>
                          <p className="text-xs font-bold text-slate-700 truncate">{c.country}</p>
                          <p className="text-[11px] text-slate-400 truncate">{c.name}</p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 pl-2">
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono font-medium text-slate-400 group-hover:text-indigo-600 transition-colors">
                            1 = ${c.rateToUsd >= 1 ? c.rateToUsd.toFixed(2) : c.rateToUsd.toFixed(4)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {filteredCurrencies.length === 0 && (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <Globe className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">No currency found</p>
                  <p className="text-xs">No matching countries or currencies for &quot;{currencySearch}&quot;</p>
                  <button
                    type="button"
                    onClick={() => setCurrencySearch('')}
                    className="mt-2 text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Clear search filter
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-5">
              <span>Showing <strong>{filteredCurrencies.length}</strong> sovereign countries &amp; currencies</span>
              <span className="font-medium text-slate-600">Cross-Border Clearance Rail Active</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerTransfers;
