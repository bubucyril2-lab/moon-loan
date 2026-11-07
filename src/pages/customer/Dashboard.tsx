import React, { useEffect, useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  TrendingUp,
  Clock,
  Send,
  Banknote,
  User as UserIcon,
  ShieldCheck,
  Sparkles,
  Lock,
  Unlock,
  Coins,
  Target,
  DollarSign,
  Check,
  Loader2,
  Globe, 
  MapPin, 
  Mail,
  Wallet,
  RefreshCw,
  Info,
  Eye,
  EyeOff,
  Copy,
  FileText,
  Building2,
  Plane,
  X,
  ExternalLink,
  Shield,
  Search,
  Filter,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Account, Transaction } from '../../types';
import { safeFormat } from '../../utils/date';
import { storageService } from '../../services/storage';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface VaultItem {
  id: string;
  name: string;
  target: number;
  saved: number;
  apy: string;
  currency: string;
}

const CARD_TEMPLATES = [
  {
    id: 'emerald',
    name: 'Emerald Titanium',
    type: 'WORLD ELITE',
    tier: 'Private Client',
    category: 'Sovereign Wealth',
    bg: 'from-[#031d16] via-[#083329] to-[#0f4437]',
    border: 'border-emerald-500/40 ring-emerald-500/10',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-500',
    chipGradient: 'from-amber-200 via-yellow-400 to-amber-300',
    network: 'Mastercard World Elite',
    glowColor: 'shadow-emerald-950/45',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  },
  {
    id: 'gold',
    name: 'Imperial Gold',
    type: 'GOLD RESERVE',
    tier: 'Executive Premier',
    category: 'Vanguard Reserve',
    bg: 'from-[#341804] via-[#4f2307] to-[#78380e]',
    border: 'border-amber-500/40 ring-amber-500/10',
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-500',
    chipGradient: 'from-slate-100 via-yellow-300 to-amber-200',
    network: 'Visa Infinite',
    glowColor: 'shadow-amber-950/45',
    badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  },
  {
    id: 'sapphire',
    name: 'Sapphire Elite',
    type: 'INFINITE SAPPHIRE',
    tier: 'Global Private',
    category: 'Zurich Custody',
    bg: 'from-[#08152e] via-[#0f2854] to-[#184483]',
    border: 'border-blue-500/40 ring-blue-500/10',
    accentText: 'text-sky-400',
    accentBg: 'bg-blue-500',
    chipGradient: 'from-yellow-200 via-blue-400 to-amber-300',
    network: 'UnionPay Diamond',
    glowColor: 'shadow-blue-950/45',
    badgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30'
  },
  {
    id: 'obsidian',
    name: 'Obsidian Black',
    type: 'SIGNATURE OBSIDIAN',
    tier: 'Centurion Bespoke',
    category: 'Sovereign Black',
    bg: 'from-[#0a0a0f] via-[#14141d] to-[#22222e]',
    border: 'border-slate-500/40 ring-slate-500/10',
    accentText: 'text-slate-300',
    accentBg: 'bg-slate-400',
    chipGradient: 'from-slate-300 via-slate-100 to-slate-400',
    network: 'Visa Infinite Privilege',
    glowColor: 'shadow-black/70',
    badgeBg: 'bg-slate-700/30 text-slate-200 border-slate-600/40'
  }
];

const FX_RATES: Record<string, number> = {
  USDEUR: 0.92,
  USDGBP: 0.78,
  USDCHF: 0.89,
  USDJPY: 155.80,
  USDSGD: 1.34,
  EURUSD: 1.087,
  GBPUSD: 1.282,
  CHFUSD: 1.124,
  JPYUSD: 0.00642,
  SGDUSD: 0.746
};

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Valuation Display Currency (USD, EUR, GBP, CHF)
  const [displayCurrency, setDisplayCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'CHF'>('USD');

  // Multi-Currency Balances
  const [currencies, setCurrencies] = useState({
    USD: 0,
    EUR: 14250.00,
    GBP: 8650.00,
    CHF: 18400.00,
    JPY: 650000,
    SGD: 9200.00
  });

  // Card Appearance & Management States
  const [activeCardIndex, setActiveCardIndex] = useState(() => {
    const saved = localStorage.getItem(`econest_card_pref_${user?.id || 'default'}`);
    return saved ? Number(saved) : 0;
  });
  const [isCardFrozen, setIsCardFrozen] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [travelModeActive, setTravelModeActive] = useState(true);

  // Ability to hide amount on ATM card and transactions (Privacy Mode)
  const [isAmountHidden, setIsAmountHidden] = useState(() => {
    const saved = localStorage.getItem(`econest_hide_amount_${user?.id || 'default'}`);
    return saved === 'true';
  });
  const [txSearch, setTxSearch] = useState('');
  const [txFilter, setTxFilter] = useState<'all' | 'debit' | 'credit'>('all');

  // High Yield Savings Vaults
  const [vaults, setVaults] = useState<VaultItem[]>([
    { id: 'v1', name: 'Global Treasury Reserve', target: 50000, saved: 18500, apy: '5.20% APY', currency: 'USD' },
    { id: 'v2', name: 'European Real Estate Escrow', target: 120000, saved: 42000, apy: '4.85% APY', currency: 'EUR' },
    { id: 'v3', name: 'Swiss Franc Liquidity Shield', target: 75000, saved: 29000, apy: '6.15% APY', currency: 'CHF' }
  ]);

  // FX Swap Engine States
  const [fxFrom, setFxFrom] = useState<'USD' | 'EUR' | 'GBP' | 'CHF' | 'JPY' | 'SGD'>('USD');
  const [fxTo, setFxTo] = useState<'USD' | 'EUR' | 'GBP' | 'CHF' | 'JPY' | 'SGD'>('EUR');
  const [fxAmount, setFxAmount] = useState('');
  const [isFxSwapping, setIsFxSwapping] = useState(false);

  // Modal State for Wire Instructions
  const [showWireModal, setShowWireModal] = useState(false);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);

  // Load balances and vaults from DB & Storage
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const acc = await storageService.getAccountByUserId(user.id);
        if (acc) {
          setAccount(acc);
          setCurrencies(prev => ({
            ...prev,
            USD: acc.balance
          }));

          const txs = await storageService.getTransactionsByAccountId(acc.id, user.id);
          setTransactions(txs.sort((a, b) => new Date(b.createdAt || b.created_at || '').getTime() - new Date(a.createdAt || a.created_at || '').getTime()));
        }

        // Load card frozen state
        const savedFrozen = localStorage.getItem(`econest_card_frozen_${user.id}`);
        if (savedFrozen) {
          setIsCardFrozen(savedFrozen === 'true');
        }

        // Load vaults
        const localVaults = localStorage.getItem(`econest_vaults_${user.id}`);
        if (localVaults) {
          setVaults(JSON.parse(localVaults));
        } else {
          localStorage.setItem(`econest_vaults_${user.id}`, JSON.stringify(vaults));
        }

        // Load currency balances
        const localCurrencies = localStorage.getItem(`econest_currencies_${user.id}`);
        if (localCurrencies) {
          const parsed = JSON.parse(localCurrencies);
          setCurrencies(prev => ({
            ...parsed,
            USD: acc ? acc.balance : parsed.USD
          }));
        }
      } catch (error) {
        console.error('Error loading international dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Calculate Consolidated Net Worth across all currency holdings converted to displayCurrency
  const calculateTotalNetWorth = () => {
    const usdEquiv = 
      currencies.USD +
      (currencies.EUR * (FX_RATES['EURUSD'] || 1.087)) +
      (currencies.GBP * (FX_RATES['GBPUSD'] || 1.282)) +
      (currencies.CHF * (FX_RATES['CHFUSD'] || 1.124)) +
      (currencies.JPY * (FX_RATES['JPYUSD'] || 0.00642)) +
      (currencies.SGD * (FX_RATES['SGDUSD'] || 0.746));

    if (displayCurrency === 'USD') return usdEquiv;
    if (displayCurrency === 'EUR') return usdEquiv * (FX_RATES['USDEUR'] || 0.92);
    if (displayCurrency === 'GBP') return usdEquiv * (FX_RATES['USDGBP'] || 0.78);
    if (displayCurrency === 'CHF') return usdEquiv * (FX_RATES['USDCHF'] || 0.89);
    return usdEquiv;
  };

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'CHF': return 'CHF ';
      case 'JPY': return '¥';
      case 'SGD': return 'S$';
      default: return '$';
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Toggle Card Freeze
  const handleToggleFreeze = () => {
    const nextState = !isCardFrozen;
    setIsCardFrozen(nextState);
    if (user) {
      localStorage.setItem(`econest_card_frozen_${user.id}`, String(nextState));
    }
    if (nextState) {
      toast('Card frozen. All authorizations temporarily halted.', {
        icon: '❄️',
      });
    } else {
      toast.success('Card unfrozen and active for global payments.');
    }
  };

  // Toggle Hide Amount Privacy Mode
  const toggleHideAmount = () => {
    const next = !isAmountHidden;
    setIsAmountHidden(next);
    if (user) {
      localStorage.setItem(`econest_hide_amount_${user.id}`, String(next));
    }
    toast.success(next ? 'Account amounts hidden (Privacy Mode ON)' : 'Account amounts visible', { id: 'hide-amt' });
  };

  // Vault helpers
  const saveVaultsToLocal = (updatedVaults: VaultItem[]) => {
    if (!user) return;
    setVaults(updatedVaults);
    localStorage.setItem(`econest_vaults_${user.id}`, JSON.stringify(updatedVaults));
  };

  const handleFundVault = async (vaultId: string, amountToFund: number) => {
    if (!account || !user) return;
    if (isNaN(amountToFund) || amountToFund <= 0) {
      toast.error('Please enter a valid allocation amount');
      return;
    }

    if (account.balance < amountToFund) {
      toast.error('Insufficient available balance on primary account');
      return;
    }

    try {
      const nextBalance = account.balance - amountToFund;
      const updatedAccount = { ...account, balance: nextBalance };
      await storageService.saveAccount(updatedAccount);
      setAccount(updatedAccount);

      const targetVault = vaults.find(v => v.id === vaultId);
      await storageService.saveTransaction({
        id: Math.random().toString(36).substr(2, 9),
        accountId: account.id,
        userId: user.id,
        amount: amountToFund,
        type: 'debit',
        description: `Vault Deposit: ${targetVault?.name || 'Treasury Vault'}`,
        status: 'completed',
        reference_id: `VLT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        created_at: new Date().toISOString()
      });

      const updatedVaults = vaults.map(v => {
        if (v.id === vaultId) {
          return { ...v, saved: v.saved + amountToFund };
        }
        return v;
      });
      saveVaultsToLocal(updatedVaults);

      const refreshedTX = await storageService.getTransactionsByAccountId(account.id, user.id);
      setTransactions(refreshedTX.sort((a, b) => new Date(b.createdAt || b.created_at || '').getTime() - new Date(a.createdAt || a.created_at || '').getTime()));

      toast.success(`Successfully allocated $${amountToFund.toLocaleString()} to ${targetVault?.name}`);
    } catch {
      toast.error('Unable to complete vault allocation. Please try again.');
    }
  };

  const handleWithdrawVault = async (vaultId: string, amountToWithdraw: number) => {
    if (!account || !user) return;
    const targetVault = vaults.find(v => v.id === vaultId);
    if (!targetVault) return;

    if (isNaN(amountToWithdraw) || amountToWithdraw <= 0) {
      toast.error('Please enter a valid withdrawal amount');
      return;
    }

    if (targetVault.saved < amountToWithdraw) {
      toast.error('Withdrawal amount exceeds accumulated vault balance');
      return;
    }

    try {
      const nextBalance = account.balance + amountToWithdraw;
      const updatedAccount = { ...account, balance: nextBalance };
      await storageService.saveAccount(updatedAccount);
      setAccount(updatedAccount);

      await storageService.saveTransaction({
        id: Math.random().toString(36).substr(2, 9),
        accountId: account.id,
        userId: user.id,
        amount: amountToWithdraw,
        type: 'credit',
        description: `Vault Withdrawal: ${targetVault.name}`,
        status: 'completed',
        reference_id: `VLT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        created_at: new Date().toISOString()
      });

      const updatedVaults = vaults.map(v => {
        if (v.id === vaultId) {
          return { ...v, saved: v.saved - amountToWithdraw };
        }
        return v;
      });
      saveVaultsToLocal(updatedVaults);

      const refreshedTX = await storageService.getTransactionsByAccountId(account.id, user.id);
      setTransactions(refreshedTX.sort((a, b) => new Date(b.createdAt || b.created_at || '').getTime() - new Date(a.createdAt || a.created_at || '').getTime()));

      toast.success(`Released $${amountToWithdraw.toLocaleString()} from ${targetVault.name} to main balance`);
    } catch {
      toast.error('Withdrawal failed. Please try again.');
    }
  };

  // FX Conversion
  const handleFXSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !user) return;
    const value = parseFloat(fxAmount);
    if (isNaN(value) || value <= 0) {
      toast.error('Please enter a valid currency quantity');
      return;
    }

    if (fxFrom === fxTo) {
      toast.error('Source and destination currencies must be different');
      return;
    }

    const sourceBalance = currencies[fxFrom];
    if (sourceBalance < value) {
      toast.error(`Insufficient ${fxFrom} funds for this conversion`);
      return;
    }

    setIsFxSwapping(true);
    try {
      // Calculate exchange
      let rate = 1;
      const pairKey = `${fxFrom}${fxTo}`;
      if (FX_RATES[pairKey]) {
        rate = FX_RATES[pairKey];
      } else {
        // Derive via USD cross rate
        const toUsdRate = fxFrom === 'USD' ? 1 : (FX_RATES[`${fxFrom}USD`] || 1);
        const fromUsdRate = fxTo === 'USD' ? 1 : (FX_RATES[`USD${fxTo}`] || 1);
        rate = toUsdRate * fromUsdRate;
      }

      const receivedAmt = Number((value * rate).toFixed(2));
      const nextCurrencies = { ...currencies };
      nextCurrencies[fxFrom] -= value;
      nextCurrencies[fxTo] += receivedAmt;

      // If USD was touched, update primary account
      if (fxFrom === 'USD') {
        const nextBalance = account.balance - value;
        const updatedAccount = { ...account, balance: nextBalance };
        await storageService.saveAccount(updatedAccount);
        setAccount(updatedAccount);
        nextCurrencies.USD = nextBalance;
      } else if (fxTo === 'USD') {
        const nextBalance = account.balance + receivedAmt;
        const updatedAccount = { ...account, balance: nextBalance };
        await storageService.saveAccount(updatedAccount);
        setAccount(updatedAccount);
        nextCurrencies.USD = nextBalance;
      }

      setCurrencies(nextCurrencies);
      if (user) {
        localStorage.setItem(`econest_currencies_${user.id}`, JSON.stringify(nextCurrencies));
      }

      // Log transaction
      await storageService.saveTransaction({
        id: Math.random().toString(36).substr(2, 9),
        accountId: account.id,
        userId: user.id,
        amount: fxFrom === 'USD' ? value : receivedAmt,
        type: fxFrom === 'USD' ? 'debit' : 'credit',
        description: `FX Conversion: ${value.toLocaleString()} ${fxFrom} → ${receivedAmt.toLocaleString()} ${fxTo} (Rate: ${rate.toFixed(4)})`,
        status: 'completed',
        reference_id: `FX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        created_at: new Date().toISOString()
      });

      // Refresh transactions
      const refreshedTX = await storageService.getTransactionsByAccountId(account.id, user.id);
      setTransactions(refreshedTX.sort((a, b) => new Date(b.createdAt || b.created_at || '').getTime() - new Date(a.createdAt || a.created_at || '').getTime()));

      setFxAmount('');
      toast.success(`Exchanged ${value.toLocaleString()} ${fxFrom} for ${receivedAmt.toLocaleString()} ${fxTo}`);
    } catch {
      toast.error('Conversion could not be completed. Please try again.');
    } finally {
      setIsFxSwapping(false);
    }
  };

  const handleDownloadStatement = () => {
    toast.success('Official e-Statement generated with verified institution seal', {
      icon: '📄'
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-32 bg-slate-200 rounded-3xl w-full"></div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Account details formatting
  const rawAccNo = account?.accountNumber || '8175861144219358';
  const formattedAccNo = rawAccNo.padEnd(16, '0').replace(/(\d{4})/g, '$1 ').trim();
  const maskedAccNo = `•••• •••• •••• ${rawAccNo.slice(-4)}`;
  const ibanNumber = `GB82 ECON 4005 15${rawAccNo.slice(-8)}`;
  const swiftBic = 'ECONGB2LXXX';
  const routingSortCode = '40-05-15';

  const chartData = [
    { name: 'Mon', Inflow: 3200, Outflow: 1200 },
    { name: 'Tue', Inflow: 1800, Outflow: 650 },
    { name: 'Wed', Inflow: 4500, Outflow: 2100 },
    { name: 'Thu', Inflow: 2400, Outflow: 980 },
    { name: 'Fri', Inflow: 6800, Outflow: 3400 },
    { name: 'Sat', Inflow: 1900, Outflow: 1400 },
    { name: 'Sun', Inflow: 5200, Outflow: 850 }
  ];

  const totalNetWorth = calculateTotalNetWorth();
  const activeTemplate = CARD_TEMPLATES[activeCardIndex] || CARD_TEMPLATES[0];

  const filteredTxs = transactions.filter(tx => {
    const q = txSearch.toLowerCase();
    const matchesSearch = 
      !txSearch ||
      (tx.description && tx.description.toLowerCase().includes(q)) ||
      (tx.recipientName && tx.recipientName.toLowerCase().includes(q)) ||
      (tx.recipientEmail && tx.recipientEmail.toLowerCase().includes(q)) ||
      ((tx as any).recipient_email && (tx as any).recipient_email.toLowerCase().includes(q)) ||
      (tx.reference_id && tx.reference_id.toLowerCase().includes(q)) ||
      ((tx as any).referenceId && (tx as any).referenceId.toLowerCase().includes(q));

    const matchesType = txFilter === 'all' || tx.type === txFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 pb-16">
      
      {/* ATM Card & Relevant Transfer Action - Next to the Top Bar */}
      <div id="atm-card-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pt-1">
        
        {/* The Physical Luxury ATM Card - Reduced size by 50% */}
        <div className="lg:col-span-5 flex justify-center lg:justify-start">
          <div className="relative group w-full max-w-[340px]">
            <div className="bg-gradient-to-tr from-[#031d16] via-[#083329] to-[#0f4437] rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden shadow-xl shadow-emerald-950/40 aspect-[1.586/1] w-full flex flex-col justify-between border border-emerald-500/40 ring-1 ring-white/10 select-none transition-all duration-300">
              
              {/* Micro laser ripples for security styling */}
              <div className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <circle cx="20" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <circle cx="20" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.2" />
                  <circle cx="80" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <circle cx="80" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.3" />
                </svg>
              </div>

              {/* Card Top Row: Brand & Network */}
              <div className="relative z-10 flex justify-between items-start">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-white/10 rounded-md flex items-center justify-center border border-white/20">
                      <Send className="h-2.5 w-2.5 text-white rotate-45 transform" />
                    </div>
                    <div>
                      <span className="font-sans font-black tracking-[0.16em] text-xs text-white">ECONEST</span>
                      <span className="text-[7px] font-bold text-emerald-400 tracking-[0.05em] ml-1 uppercase">WORLD ELITE</span>
                    </div>
                  </div>
                  <p className="text-[7px] font-bold uppercase tracking-[0.12em] text-slate-300">ATM DEBIT & WIRE REPOSITORY</p>
                </div>

                <div className="flex items-center gap-1.5 text-right">
                  <div>
                    <p className="text-[7.5px] font-black text-emerald-400 tracking-wider uppercase leading-none">MASTERCARD</p>
                    <p className="text-[6.5px] font-bold text-slate-300 uppercase tracking-tight">World Elite</p>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="h-3 w-3" />
                  </div>
                </div>
              </div>

              {/* EMV Micro-Chip & Contactless waves */}
              <div className="relative z-10 flex items-center justify-between mt-1">
                <div className="w-[34px] h-[25px] rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-300 relative border border-amber-600/40 overflow-hidden shadow-md shadow-black/30">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[0.5px] bg-yellow-900/40"></div>
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[0.5px] bg-yellow-900/40"></div>
                  <div className="absolute inset-[3px] border border-yellow-800/20 rounded-[1.5px]"></div>
                </div>

                {/* Contactless Waves */}
                <div className="flex items-center gap-0.5 opacity-80" title="Contactless Enabled">
                  <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                  <div className="w-[2px] h-2.5 border-r-2 border-slate-200 rounded-full"></div>
                  <div className="w-[2px] h-3.5 border-r-2 border-slate-200 rounded-full"></div>
                </div>
              </div>

              {/* Card Number */}
              <div className="relative z-10 mt-1">
                <div className="flex items-center justify-between">
                  <p className="text-[6.5px] text-slate-400 uppercase tracking-[0.2em] font-black">Card Number</p>
                  <button
                    onClick={() => copyToClipboard(rawAccNo, 'Card Number')}
                    className="text-[8px] text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                    title="Copy card number"
                  >
                    <Copy className="h-2 w-2" />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="font-mono text-sm sm:text-base tracking-[0.12em] text-white font-black drop-shadow-md">
                  {showCardDetails ? formattedAccNo : maskedAccNo}
                </p>
              </div>

              {/* Expiry & CVV */}
              <div className="relative z-10 flex items-center gap-4 mt-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-[5.5px] font-black text-slate-400 uppercase leading-[6px] text-right">EXPIRES<br/>END</span>
                  <span className="font-mono text-[10px] text-white font-bold tracking-wider">08 / 31</span>
                </div>
                <button
                  onClick={() => setShowCardDetails(!showCardDetails)}
                  className="flex items-center gap-1 cursor-pointer hover:opacity-90 transition-opacity"
                  title="Toggle CVV view"
                >
                  <span className="text-[5.5px] font-black text-slate-400 uppercase leading-[6px] text-right">SECURITY<br/>CVV</span>
                  <span className="font-mono text-[10px] text-white font-bold tracking-wider bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
                    {showCardDetails ? '482' : '•••'}
                  </span>
                </button>
              </div>

              {/* Card Holder & Balance with Hide Amount feature */}
              <div className="relative z-10 flex justify-between items-end mt-1 pt-1.5 border-t border-white/10 gap-2">
                <div className="min-w-0">
                  <p className="text-[6.5px] text-slate-400 uppercase tracking-wider font-black">Cardholder</p>
                  <p className="text-[11px] sm:text-xs font-bold tracking-wide text-slate-100 uppercase truncate max-w-[130px]">
                    {user?.fullName || 'ELIZABETH ZAKS'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center justify-end gap-1">
                    <p className="text-[6.5px] text-slate-400 uppercase tracking-wider font-black">Available Balance</p>
                    <button
                      onClick={toggleHideAmount}
                      className="text-slate-400 hover:text-white transition-colors p-0.5 cursor-pointer"
                      title={isAmountHidden ? "Reveal Balance" : "Hide Balance"}
                    >
                      {isAmountHidden ? <EyeOff className="h-2.5 w-2.5 text-amber-400" /> : <Eye className="h-2.5 w-2.5" />}
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm font-mono font-black text-white">
                    {isAmountHidden ? (
                      <span className="tracking-widest text-slate-300 font-bold select-none">••••••••</span>
                    ) : (
                      <span>${account?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    )}{' '}
                    <span className="text-[8px] font-sans text-slate-400">USD</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Relevant Transfer Actions - Clean & Focused */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Capital Transfer
              </span>
              <button
                onClick={toggleHideAmount}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer transition-colors"
                title={isAmountHidden ? "Show Balance" : "Hide Balance"}
              >
                {isAmountHidden ? <Eye className="h-3.5 w-3.5 text-emerald-600" /> : <EyeOff className="h-3.5 w-3.5" />}
                <span>{isAmountHidden ? 'Show Amount' : 'Hide Amount'}</span>
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">Available Liquid Balance</p>
              <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight mt-0.5">
                {isAmountHidden ? (
                  <span className="text-slate-400 select-none">••••••••</span>
                ) : (
                  <span>${account?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-sm font-sans font-bold text-slate-400">USD</span></span>
                )}
              </p>
            </div>
          </div>

          {/* Primary Transfer Action Buttons */}
          <div className="space-y-2.5">
            <Link
              to="/dashboard/transfers"
              className="flex items-center justify-center gap-2.5 w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-900/15 transition-all transform active:scale-[0.99]"
            >
              <Send className="h-4 w-4" />
              <span>Transfer Money</span>
            </Link>

            <button
              onClick={() => setShowWireModal(true)}
              className="flex items-center justify-center gap-2 w-full py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-sm transition-all border border-slate-800 cursor-pointer"
            >
              <Building2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Wire Transfer Instructions</span>
            </button>
          </div>

          {/* Quick One-Click Amount Transfer Shortcuts */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Transfer</p>
            <div className="grid grid-cols-4 gap-2">
              {[500, 1000, 2500, 5000].map((amt) => (
                <Link
                  key={amt}
                  to={`/dashboard/transfers?amount=${amt}`}
                  className="py-2 text-center text-xs font-mono font-bold text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 rounded-xl border border-slate-200 transition-all"
                >
                  ${amt.toLocaleString()}
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 2b. Immediate Transaction History Ledger (Placed directly below ATM Card as requested) */}
      <div id="transactions-ledger-section" className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200 shadow-sm space-y-5 sm:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-blue-50 text-blue-700 uppercase border border-blue-200">
                <Clock className="h-3 w-3" />
                OFFICIAL TRANSACTION LEDGER
              </span>
              <span className="text-xs font-bold text-slate-500">
                {filteredTxs.length} Record{filteredTxs.length === 1 ? '' : 's'}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1">
              Transaction History & Settlements
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Real-time audit log of domestic debits, international SWIFT wires, and incoming credits.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search recipient, email, ref..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-64"
              />
              {txSearch && (
                <button
                  onClick={() => setTxSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['all', 'debit', 'credit'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setTxFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                    txFilter === tab
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab === 'debit' ? 'Debits' : 'Credits'}
                </button>
              ))}
            </div>

            {/* Link to Full Statement */}
            <Link
              to="/dashboard/history"
              className="text-xs font-black text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-1 uppercase tracking-wider px-3 py-2 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              <span>Full Statement</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Mobile & Tablet View: High-Visibility Transaction Cards (Zero Horizontal Scroll) */}
        <div className="block lg:hidden space-y-3">
          {filteredTxs.slice(0, 10).map((tx) => {
            const isCredit = tx.type === 'credit';
            return (
              <div key={tx.id} className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 text-xs break-words leading-tight">{tx.description}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{safeFormat(tx.createdAt || tx.created_at, 'MMM dd, yyyy • HH:mm')}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-mono font-black text-sm ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {isAmountHidden ? '••••••' : `${isCredit ? '+' : '-'}$${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    </p>
                    <span className="text-[9px] font-bold text-slate-400">USD</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px] gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                      Settled
                    </span>
                    {tx.recipientName && (
                      <span className="text-slate-500 font-medium break-words">To: {tx.recipientName}</span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedReceiptTx(tx)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <FileText className="h-3 w-3 text-emerald-600" />
                    <span>Receipt</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredTxs.length === 0 && (
            <div className="py-8 text-center text-slate-400">
              <p className="text-xs font-bold text-slate-600">No transactions match your search</p>
              <p className="text-[10px] text-slate-400 mt-1">Try adjusting the filter or search term</p>
            </div>
          )}
        </div>

        {/* Desktop View: Transactions Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">Type / Rail</th>
                <th className="pb-3">Counterparty & Description</th>
                <th className="pb-3">Reference / Email</th>
                <th className="pb-3">Date & Time</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Amount</th>
                <th className="pb-3 pr-2 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTxs.slice(0, 10).map((tx) => {
                const isCredit = tx.type === 'credit';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Rail / Type */}
                    <td className="py-3.5 pl-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 capitalize">{tx.type}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">
                            {tx.transferType ? tx.transferType.toUpperCase() : 'SETTLED'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Counterparty & Description */}
                    <td className="py-3.5 max-w-xs">
                      <p className="font-bold text-slate-900 truncate" title={tx.description}>
                        {tx.description}
                      </p>
                      {tx.recipientName && (
                        <p className="text-[11px] text-slate-500 font-normal">
                          Beneficiary: <span className="font-medium text-slate-700">{tx.recipientName}</span>
                        </p>
                      )}
                    </td>

                    {/* Reference / Receiver Email */}
                    <td className="py-3.5">
                      <p className="font-mono text-[11px] text-slate-600 font-bold">
                        {tx.referenceId || tx.reference_id || `TX-${tx.id.slice(0, 8).toUpperCase()}`}
                      </p>
                      {(tx.recipientEmail || tx.recipient_email) && (
                        <p className="text-[11px] text-blue-600 font-medium truncate max-w-[180px]" title={tx.recipientEmail || tx.recipient_email}>
                          {tx.recipientEmail || tx.recipient_email}
                        </p>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 text-slate-500 whitespace-nowrap">
                      {safeFormat(tx.createdAt || tx.created_at, 'MMM dd, yyyy • HH:mm')}
                    </td>

                    {/* Status */}
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Settled
                      </span>
                    </td>

                    {/* Amount (Respects isAmountHidden) */}
                    <td className="py-3.5 text-right font-mono font-black text-sm whitespace-nowrap">
                      {isAmountHidden ? (
                        <span className="text-slate-400 select-none tracking-widest font-bold">••••••</span>
                      ) : (
                        <span className={isCredit ? 'text-emerald-600' : 'text-slate-900'}>
                          {isCredit ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 ml-1 font-sans font-normal">USD</span>
                    </td>

                    {/* Receipt Action */}
                    <td className="py-3.5 pr-2 text-right">
                      <button
                        onClick={() => setSelectedReceiptTx(tx)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                        title="View Official Transaction Receipt"
                      >
                        <FileText className="h-3 w-3" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredTxs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    <p className="text-sm font-bold text-slate-600">No transactions match your search</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting the filter or search term</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info & view all */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p className="text-[11px]">
            Showing recent settlements. All transactions are cryptographically verified and backed by FDIC/Central Bank clearance.
          </p>
          <Link
            to="/dashboard/history"
            className="text-xs font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-wider flex items-center gap-1 whitespace-nowrap"
          >
            <span>Complete Ledger ({transactions.length})</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* 3. Multi-Currency Global Accounts (Wallets) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200 shadow-sm space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 uppercase border border-blue-100">
                <Coins className="h-3 w-3" /> MULTI-CURRENCY PORTFOLIO
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
              International Currency Accounts
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Hold, convert, and transact across 6 premier international reserve currencies with 0% foreign transaction markups.
            </p>
          </div>

          <a 
            href="#fx-swap-desk"
            className="text-xs font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 uppercase tracking-wider"
          >
            <span>Execute Instant FX Swap</span>
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        {/* Currency Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', balance: currencies.USD, routing: 'Fedwire / ACH' },
            { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', balance: currencies.EUR, routing: 'SEPA Instant' },
            { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', balance: currencies.GBP, routing: 'Faster Payments' },
            { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr.', flag: '🇨🇭', balance: currencies.CHF, routing: 'SIC Zurich' },
            { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', balance: currencies.JPY, routing: 'Zengin Tokyo' },
            { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', balance: currencies.SGD, routing: 'FAST Singapore' }
          ].map((item) => (
            <div 
              key={item.code} 
              className="bg-slate-50 hover:bg-slate-100/80 rounded-2xl p-4 border border-slate-200/80 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="flex justify-between items-start">
                <span className="text-xl select-none" role="img" aria-label={item.name}>{item.flag}</span>
                <span className="font-mono text-[10px] font-black uppercase text-slate-400 group-hover:text-emerald-600 transition-colors">
                  {item.code}
                </span>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.name}</p>
                <p className="font-mono font-black text-slate-900 text-base sm:text-lg mt-0.5 tracking-tight truncate">
                  {item.symbol}{item.balance.toLocaleString(undefined, { minimumFractionDigits: item.code === 'JPY' ? 0 : 2, maximumFractionDigits: item.code === 'JPY' ? 0 : 2 })}
                </p>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase truncate">{item.routing}</p>
              </div>

              <button
                onClick={() => {
                  setFxFrom(item.code as any);
                  const el = document.getElementById('fx-swap-desk');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-xl text-[10px] font-black uppercase transition-all shadow-2xs"
              >
                Convert
              </button>
            </div>
          ))}
        </div>
      </div>



      {/* 5. Institutional Interbank FX Desk & High-Yield Global Savings Vaults */}
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        
        {/* Institutional Foreign Exchange Converter */}
        <div id="fx-swap-desk" className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200 shadow-sm space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-700 uppercase tracking-widest border border-amber-100">
                INSTANT LIQUIDITY DESK
              </span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-amber-600" />
                Interbank Currency Exchange (FX)
              </h3>
            </div>
            <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              0% Foreign Markup
            </span>
          </div>

          {/* Real-time FX Rates Ticker */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150">
              <p className="text-[9px] font-black text-slate-400 uppercase">USD / EUR</p>
              <p className="font-mono font-bold text-slate-800 mt-0.5">0.9200</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150">
              <p className="text-[9px] font-black text-slate-400 uppercase">USD / GBP</p>
              <p className="font-mono font-bold text-slate-800 mt-0.5">0.7800</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150">
              <p className="text-[9px] font-black text-slate-400 uppercase">USD / CHF</p>
              <p className="font-mono font-bold text-slate-800 mt-0.5">0.8900</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150">
              <p className="text-[9px] font-black text-slate-400 uppercase">USD / JPY</p>
              <p className="font-mono font-bold text-slate-800 mt-0.5">155.80</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150">
              <p className="text-[9px] font-black text-slate-400 uppercase">USD / SGD</p>
              <p className="font-mono font-bold text-slate-800 mt-0.5">1.3400</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150">
              <p className="text-[9px] font-black text-slate-400 uppercase">EUR / USD</p>
              <p className="font-mono font-bold text-slate-800 mt-0.5">1.0870</p>
            </div>
          </div>

          {/* Quick Swap Form */}
          <form onSubmit={handleFXSwap} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Convert From</label>
                <select
                  value={fxFrom}
                  onChange={(e) => setFxFrom(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="USD">🇺🇸 USD (US Dollar)</option>
                  <option value="EUR">🇪🇺 EUR (Euro)</option>
                  <option value="GBP">🇬🇧 GBP (British Pound)</option>
                  <option value="CHF">🇨🇭 CHF (Swiss Franc)</option>
                  <option value="JPY">🇯🇵 JPY (Japanese Yen)</option>
                  <option value="SGD">🇸🇬 SGD (Singapore Dollar)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  Available: {currencies[fxFrom].toLocaleString()} {fxFrom}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Exchange Into</label>
                <select
                  value={fxTo}
                  onChange={(e) => setFxTo(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="EUR">🇪🇺 EUR (Euro)</option>
                  <option value="USD">🇺🇸 USD (US Dollar)</option>
                  <option value="GBP">🇬🇧 GBP (British Pound)</option>
                  <option value="CHF">🇨🇭 CHF (Swiss Franc)</option>
                  <option value="JPY">🇯🇵 JPY (Japanese Yen)</option>
                  <option value="SGD">🇸🇬 SGD (Singapore Dollar)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  Holding: {currencies[fxTo].toLocaleString()} {fxTo}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Amount to Exchange</label>
              <div className="relative">
                <input
                  type="number"
                  value={fxAmount}
                  onChange={(e) => setFxAmount(e.target.value)}
                  placeholder={`Amount in ${fxFrom}...`}
                  className="w-full pl-4 pr-16 py-3 bg-white border border-slate-250 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => setFxAmount(String(currencies[fxFrom]))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Live conversion quote */}
            {fxAmount && !isNaN(parseFloat(fxAmount)) && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Interbank Rate:</span>
                  <strong className="font-mono text-slate-900">
                    1 {fxFrom} ≈ {(FX_RATES[`${fxFrom}${fxTo}`] || 1).toFixed(4)} {fxTo}
                  </strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Guaranteed Markup:</span>
                  <strong className="text-emerald-600">0.00% (Institutional Tier)</strong>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-900 font-extrabold text-sm">
                  <span>Estimated Total Credited:</span>
                  <span className="font-mono text-emerald-600">
                    {(parseFloat(fxAmount) * (FX_RATES[`${fxFrom}${fxTo}`] || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {fxTo}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isFxSwapping}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
            >
              {isFxSwapping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                  <span>Clearing Foreign Exchange...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 text-emerald-400" />
                  <span>Confirm Foreign Currency Conversion</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Global Treasury & High-Yield Escrow Vaults */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200 shadow-sm space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-purple-50 text-purple-700 uppercase tracking-widest border border-purple-100">
                CAPITAL PRESERVATION
              </span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                High-Yield Treasury & Escrow Vaults
              </h3>
            </div>
            <span className="text-[10px] font-black text-purple-600 uppercase bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
              Up to 6.15% APY
            </span>
          </div>

          <div className="space-y-4">
            {vaults.map((v) => {
              const progress = Math.min(Math.round((v.saved / v.target) * 100), 100);
              return (
                <div key={v.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-black text-slate-800">{v.name}</p>
                      <p className="text-[10px] text-purple-600 uppercase font-black tracking-wide mt-0.5">
                        {v.apy} Compound Yield
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-black text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                      {progress}% Target
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full transition-all duration-700" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 font-mono">
                      <span>Accumulated: ${v.saved.toLocaleString()}</span>
                      <span>Target: ${v.target.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Fund & Release Controls */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        const amtStr = prompt(`Enter capital amount in USD to allocate to "${v.name}":`, "5000");
                        if (amtStr) {
                          const amt = parseFloat(amtStr);
                          handleFundVault(v.id, amt);
                        }
                      }}
                      className="flex-1 py-2 bg-white hover:bg-purple-50 text-[10px] font-black uppercase text-purple-700 border border-purple-200 rounded-xl transition-all shadow-2xs"
                    >
                      Allocate Funds
                    </button>
                    <button
                      onClick={() => {
                        const amtStr = prompt(`Enter capital amount in USD to withdraw from "${v.name}" back to main balance:`, "1000");
                        if (amtStr) {
                          const amt = parseFloat(amtStr);
                          handleWithdrawVault(v.id, amt);
                        }
                      }}
                      className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase text-slate-600 rounded-xl transition-all"
                    >
                      Release
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5 font-medium">
            <Info className="h-3.5 w-3.5 text-purple-600" />
            <span>Treasury interest is credited autonomously at the end of each calendar week.</span>
          </div>
        </div>

      </div>

      {/* 6. Cashflow Analytics & Sector Outflow Distribution */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200 shadow-sm space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-indigo-50 text-indigo-700 uppercase tracking-widest border border-indigo-100">
              CAPITAL VELOCITY
            </span>
            <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1">
              7-Day International Cashflow Analytics
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Inbound settlements vs. outbound cross-border capital distribution.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Inflow
            </span>
            <span className="inline-flex items-center gap-1.5 ml-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Outflow
            </span>
          </div>
        </div>

        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                labelStyle={{ fontWeight: 'black', textTransform: 'uppercase', color: '#94a3b8', fontSize: '10px' }}
              />
              <Area type="monotone" name="Inflow Volume" dataKey="Inflow" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInflow)" />
              <Area type="monotone" name="Outflow Volume" dataKey="Outflow" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorOutflow)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>



      {/* Wire Instructions Modal */}
      {showWireModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative space-y-6">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 uppercase tracking-widest border border-emerald-100">
                  OFFICIAL BANKING COORDINATES
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">International Wire Instructions</h3>
                <p className="text-xs text-slate-500">Provide these coordinates to counterparties for incoming transfers.</p>
              </div>
              <button 
                onClick={() => setShowWireModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Beneficiary Name</p>
                  <p className="font-bold text-slate-900">{user?.fullName}</p>
                </div>
                <button onClick={() => copyToClipboard(user?.fullName || '', 'Beneficiary Name')} className="text-slate-400 hover:text-emerald-600">
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Bank Name</p>
                  <p className="font-bold text-slate-900">Econest International Bank PLC</p>
                </div>
                <button onClick={() => copyToClipboard('Econest International Bank PLC', 'Bank Name')} className="text-slate-400 hover:text-emerald-600">
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">IBAN (International Account Number)</p>
                  <p className="font-mono font-bold text-slate-900">{ibanNumber}</p>
                </div>
                <button onClick={() => copyToClipboard(ibanNumber.replace(/\s/g, ''), 'IBAN')} className="text-slate-400 hover:text-emerald-600">
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">SWIFT / BIC Code</p>
                  <p className="font-mono font-bold text-slate-900">{swiftBic}</p>
                </div>
                <button onClick={() => copyToClipboard(swiftBic, 'SWIFT Code')} className="text-slate-400 hover:text-emerald-600">
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Clearing Sort Code / Routing</p>
                  <p className="font-mono font-bold text-slate-900">{routingSortCode} (UK) / 021000089 (US Fedwire)</p>
                </div>
                <button onClick={() => copyToClipboard(routingSortCode, 'Sort Code')} className="text-slate-400 hover:text-emerald-600">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowWireModal(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Close Instructions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Transaction Settlement Receipt Modal */}
      {selectedReceiptTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  selectedReceiptTx.type === 'credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {selectedReceiptTx.type === 'credit' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 uppercase tracking-widest border border-emerald-200">
                    SETTLED AUDIT RECEIPT
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-0.5">
                    {selectedReceiptTx.type === 'credit' ? 'Inward Wire Receipt' : 'Outward Transfer Receipt'}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedReceiptTx(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Amount Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settled Amount</p>
              <p className={`text-2xl font-black font-mono ${
                selectedReceiptTx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
              }`}>
                {selectedReceiptTx.type === 'credit' ? '+' : '-'}${selectedReceiptTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
              </p>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <Check className="h-3 w-3" />
                <span>Interbank Clearance Completed</span>
              </div>
            </div>

            {/* Details Table */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Reference Code:</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedReceiptTx.referenceId || selectedReceiptTx.reference_id || `TX-${selectedReceiptTx.id.slice(0, 10).toUpperCase()}`}
                </span>
              </div>

              {selectedReceiptTx.recipientName && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Beneficiary / Recipient:</span>
                  <span className="font-bold text-slate-800">{selectedReceiptTx.recipientName}</span>
                </div>
              )}

              {(selectedReceiptTx.recipientEmail || selectedReceiptTx.recipient_email) && (
                <div className="flex justify-between py-1.5 border-b border-slate-100 gap-3">
                  <span className="text-slate-400 font-medium shrink-0">Receiver Email:</span>
                  <span className="font-medium text-blue-600 break-all text-right">{selectedReceiptTx.recipientEmail || selectedReceiptTx.recipient_email}</span>
                </div>
              )}

              <div className="flex justify-between py-1.5 border-b border-slate-100 gap-3">
                <span className="text-slate-400 font-medium shrink-0">Description:</span>
                <span className="font-bold text-slate-800 text-right break-words max-w-[220px]" title={selectedReceiptTx.description}>
                  {selectedReceiptTx.description}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Transfer Rail:</span>
                <span className="font-bold text-slate-800 uppercase">
                  {selectedReceiptTx.transferType ? `${selectedReceiptTx.transferType} Wire` : 'Federal Reserve Wire'}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Settlement Date:</span>
                <span className="font-medium text-slate-800">
                  {safeFormat(selectedReceiptTx.createdAt || selectedReceiptTx.created_at, 'MMMM dd, yyyy • HH:mm:ss')}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  copyToClipboard(
                    selectedReceiptTx.referenceId || selectedReceiptTx.reference_id || selectedReceiptTx.id,
                    'Reference ID'
                  );
                }}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Ref</span>
              </button>
              <button
                onClick={() => setSelectedReceiptTx(null)}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerDashboard;
