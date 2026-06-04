import React, { useEffect, useState, useRef } from 'react';
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
  TrendingDown,
  Sparkles,
  Lock,
  Unlock,
  ChevronRight,
  Coins,
  Target,
  DollarSign,
  Activity,
  Flame,
  Zap,
  Check,
  Loader2,
  Globe, 
  MapPin, 
  Calendar, 
  Mail,
  ShieldAlert,
  HelpCircle,
  Coffee,
  ShoppingBag,
  Tv,
  Wallet,
  RefreshCw,
  Info
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
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import TradingChart from '../../components/TradingChart';

interface LivePriceHistory {
  [key: string]: number[];
}

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Surface Drag & Scroll Lock State
  const [isChartLocked, setIsChartLocked] = useState(true);

  // Trading Ticker States
  const [livePrices, setLivePrices] = useState({
    BTC: 68420.50,
    ETH: 3450.75,
    SOL: 142.20,
    GLD: 2340.80
  });
  const [prevPrices, setPrevPrices] = useState({ ...livePrices });

  // Portfolios and Holdings (Persisted by user id in localStorage)
  const [holdings, setHoldings] = useState({
    BTC: 0.045,
    ETH: 0.85,
    SOL: 12.00,
    GLD: 2.5
  });

  // Vaults List
  const [vaults, setVaults] = useState([
    { id: 'v1', name: '🏝️ Maldives Coastal Escape', target: 8000, saved: 2500, apy: '5.2% APY' },
    { id: 'v2', name: '🚗 Autonomous EV Roadster Fund', target: 95000, saved: 16500, apy: '6.5% APY' },
    { id: 'v3', name: '🏢 High-Yield Cash Reserve Compound', target: 20000, saved: 4500, apy: '4.8% APY' }
  ]);

  // Secondary currency balances
  const [currencies, setCurrencies] = useState({
    USD: 0, // synced dynamically
    EUR: 320.50,
    GBP: 145.00,
    JPY: 22000
  });

  // FX Swap states
  const [fxFrom, setFxFrom] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  const [fxTo, setFxTo] = useState<'EUR' | 'GBP' | 'JPY'>('EUR');
  const [fxAmount, setFxAmount] = useState('');
  const [isFxSwapping, setIsFxSwapping] = useState(false);

  // Active Trade States
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradeAsset, setTradeAsset] = useState<'BTC' | 'ETH' | 'SOL' | 'GLD'>('BTC');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradePin, setTradePin] = useState('');
  const [isTrading, setIsTrading] = useState(false);

  // Live Bills List
  const [bills, setBills] = useState([
    { id: 'b1', name: '💡 ElectriCity Mega Grid', provider: 'City Utilities Corp', amount: 84.50, dueDate: 'In 3 Days', isPaid: false },
    { id: 'b2', name: '🌐 Hyper Fiber Web Network', provider: 'GigaLink Broadband', amount: 49.99, dueDate: 'In 6 Days', isPaid: false },
    { id: 'b3', name: '🛡️ Econest Vault Maintenance Node', provider: 'Econest Security Ledger', amount: 15.00, dueDate: 'In 12 Days', isPaid: false }
  ]);

  // Load balances and holdings from DB & Storage
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const acc = await storageService.getAccountByUserId(user.id);
        if (acc) {
          setAccount(acc);
          
          // Sync FX currencies
          setCurrencies(prev => ({
            ...prev,
            USD: acc.balance
          }));

          const txs = await storageService.getTransactionsByAccountId(acc.id, user.id);
          setTransactions(txs.sort((a, b) => new Date(b.createdAt || b.created_at || '').getTime() - new Date(a.createdAt || a.created_at || '').getTime()));
        }

        // Load persisted holdings
        const localHold = localStorage.getItem(`econest_holdings_${user.id}`);
        if (localHold) {
          setHoldings(JSON.parse(localHold));
        } else {
          localStorage.setItem(`econest_holdings_${user.id}`, JSON.stringify(holdings));
        }

        // Load persisted vaults
        const localVaults = localStorage.getItem(`econest_vaults_${user.id}`);
        if (localVaults) {
          setVaults(JSON.parse(localVaults));
        } else {
          localStorage.setItem(`econest_vaults_${user.id}`, JSON.stringify(vaults));
        }

        // Load bills paid status
        const localBills = localStorage.getItem(`econest_bills_${user.id}`);
        if (localBills) {
          setBills(JSON.parse(localBills));
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('FAILED TO FETCH SECURE ACCOUNT LEDGER');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Live Price Feed ticking every 1.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setLivePrices(prev => {
        const updated = {
          BTC: Number((prev.BTC + (Math.random() - 0.5) * 65).toFixed(2)),
          ETH: Number((prev.ETH + (Math.random() - 0.5) * 8.5).toFixed(2)),
          SOL: Number((prev.SOL + (Math.random() - 0.5) * 0.65).toFixed(3)),
          GLD: Number((prev.GLD + (Math.random() - 0.5) * 2.1).toFixed(2))
        };
        setPrevPrices({ ...prev });
        return updated;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  // Save changes helper
  const saveVaultsToLocal = (updatedVaults: typeof vaults) => {
    if (!user) return;
    setVaults(updatedVaults);
    localStorage.setItem(`econest_vaults_${user.id}`, JSON.stringify(updatedVaults));
  };

  // Fund savings vault
  const handleFundVault = async (vaultId: string, amountToFund: number) => {
    if (!account || !user) return;
    if (isNaN(amountToFund) || amountToFund <= 0) {
      toast.error("INVALID FUNDING AMOUNT REQUIRED");
      return;
    }

    if (account.balance < amountToFund) {
      toast.error("INSUFFICIENT FUNDS ON PRIMARY ACCOUNT LEDGER");
      return;
    }

    try {
      // Modify account balance
      const nextBalance = account.balance - amountToFund;
      const updatedAccount = { ...account, balance: nextBalance };
      
      await storageService.saveAccount(updatedAccount);
      setAccount(updatedAccount);

      // Save transaction
      const targetVault = vaults.find(v => v.id === vaultId);
      await storageService.saveTransaction({
        id: Math.random().toString(36).substr(2, 9),
        accountId: account.id,
        userId: user.id,
        amount: amountToFund,
        type: 'debit',
        description: `Vault Allocation: [${targetVault?.name || 'High-Yield Sub-ledger'}]`,
        status: 'completed',
        reference_id: `VLT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        created_at: new Date().toISOString()
      });

      // Save notification
      await storageService.saveNotification({
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        title: 'Savings Vault Funded',
        message: `Successfully set aside $${amountToFund.toLocaleString()} to ${targetVault?.name || 'Vault'}.`,
        type: 'transaction',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      // Update local vaults list
      const updatedVaults = vaults.map(v => {
        if (v.id === vaultId) {
          return { ...v, saved: v.saved + amountToFund };
        }
        return v;
      });
      saveVaultsToLocal(updatedVaults);

      // Refresh transactions
      const refreshedTX = await storageService.getTransactionsByAccountId(account.id, user.id);
      setTransactions(refreshedTX.sort((a, b) => new Date(b.createdAt || b.created_at || '').getTime() - new Date(a.createdAt || a.created_at || '').getTime()));

      toast.success("FUNDS SECURELY MOVED TO SUB-INTEREST VAULT!");
    } catch (e) {
      toast.error("TRANSACTING FAILED. RE-ESTABLISHING COMPLIANCE HANDSHAKE.");
    }
  };

  // Withdraw from savings vault
  const handleWithdrawVault = async (vaultId: string, amountToWithdraw: number) => {
    if (!account || !user) return;
    const targetVault = vaults.find(v => v.id === vaultId);
    if (!targetVault) return;

    if (isNaN(amountToWithdraw) || amountToWithdraw <= 0) {
      toast.error("INVALID AMOUT LEVEL SPECIFIED");
      return;
    }

    if (targetVault.saved < amountToWithdraw) {
      toast.error("WITHDRAWAL VALUE EXCEEDS THE ACCUMULATED VAULT AMOUNT");
      return;
    }

    try {
      const nextBalance = account.balance + amountToWithdraw;
      const updatedAccount = { ...account, balance: nextBalance };
      
      await storageService.saveAccount(updatedAccount);
      setAccount(updatedAccount);

      // Save transaction
      await storageService.saveTransaction({
        id: Math.random().toString(36).substr(2, 9),
        accountId: account.id,
        userId: user.id,
        amount: amountToWithdraw,
        type: 'credit',
        description: `Vault Liquidation Release: [${targetVault.name}]`,
        status: 'completed',
        reference_id: `VLT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        created_at: new Date().toISOString()
      });

      // Save notification
      await storageService.saveNotification({
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        title: 'Vault Funds Released',
        message: `Withdrew $${amountToWithdraw.toLocaleString()} from ${targetVault.name} back to main ledger.`,
        type: 'transaction',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      // Update vaults state
      const updatedVaults = vaults.map(v => {
        if (v.id === vaultId) {
          return { ...v, saved: v.saved - amountToWithdraw };
        }
        return v;
      });
      saveVaultsToLocal(updatedVaults);

      // Refresh transactions
      const refreshedTX = await storageService.getTransactionsByAccountId(account.id, user.id);
      setTransactions(refreshedTX.sort((a, b) => new Date(b.createdAt || b.created_at || '').getTime() - new Date(a.createdAt || a.created_at || '').getTime()));

      toast.success("LIQUID CAPITAL TRANSLATED TO PRIMARY ACCOUNT DEBIT LEDGER!");
    } catch (e) {
      toast.error("LIQUIDATION TIMEOUT. PLEASE TRY AGAIN.");
    }
  };

  // Pay invoices center
  const handlePayBill = async (billId: string) => {
    if (!account || !user) return;
    const bill = bills.find(b => b.id === billId);
    if (!bill || bill.isPaid) return;

    if (account.balance < bill.amount) {
      toast.error(`INSUFFICIENT LEDGER VALUE FOR PAYING BILL: ${bill.name.toUpperCase()}`);
      return;
    }

    try {
      const updatedBalance = account.balance - bill.amount;
      const updatedAccount = { ...account, balance: updatedBalance };

      await storageService.saveAccount(updatedAccount);
      setAccount(updatedAccount);

      // Save transaction
      await storageService.saveTransaction({
        id: Math.random().toString(36).substr(2, 9),
        accountId: account.id,
        userId: user.id,
        amount: bill.amount,
        type: 'debit',
        description: `Settled Bill: Invoice [${bill.name}]`,
        status: 'completed',
        reference_id: `BIL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        created_at: new Date().toISOString()
      });

      // Save Notification
      await storageService.saveNotification({
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        title: 'Autonomous Bill Paid',
        message: `Your utility/security bill for ${bill.name} was successfully settled. $${bill.amount.toFixed(2)} debited.`,
        type: 'transaction',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      // Local persistence update
      const updatedBills = bills.map(b => {
        if (b.id === billId) return { ...b, isPaid: true };
        return b;
      });
      setBills(updatedBills);
      localStorage.setItem(`econest_bills_${user.id}`, JSON.stringify(updatedBills));

      // Refresh transactions list
      const refreshedTX = await storageService.getTransactionsByAccountId(account.id, user.id);
      setTransactions(refreshedTX.sort((a, b) => new Date(b.createdAt || b.created_at || '').getTime() - new Date(a.createdAt || a.created_at || '').getTime()));

      toast.success("INVOICE SETTLED SUCCESSFULLY via ECONEST CLEARING CHANNEL.");
    } catch (e) {
      toast.error("BILL PAY PROCESS HALTED. RE-CHECK SERVER HANDSHAKE.");
    }
  };

  // FX Swap Engine
  const handleFXSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !user) return;
    const value = parseFloat(fxAmount);
    if (isNaN(value) || value <= 0) {
      toast.error("INVALID FOREIGN EXCHANGE QUANTITY SET");
      return;
    }

    // Rate calculations
    const rates: { [key: string]: number } = {
      USDEUR: 0.92,
      USDGBP: 0.78,
      USDJPY: 156.40,
      EURUSD: 1.09,
      GBPUSD: 1.28
    };

    if (fxFrom === 'USD') {
      if (account.balance < value) {
        toast.error("INSUFFICIENT PRIMARY USD LEDGER BALANCE");
        return;
      }

      setIsFxSwapping(true);
      try {
        const rateKey = `${fxFrom}${fxTo}`;
        const conversionRate = rates[rateKey] || 1;
        const convertedAmt = Number((value * conversionRate).toFixed(2));

        // Deduct USD balance
        const nextBalance = account.balance - value;
        const updatedAccount = { ...account, balance: nextBalance };
        await storageService.saveAccount(updatedAccount);
        setAccount(updatedAccount);

        // Update other currencies balances
        const targetCurState = { ...currencies };
        targetCurState.USD = nextBalance;
        if (fxTo === 'EUR') targetCurState.EUR += convertedAmt;
        if (fxTo === 'GBP') targetCurState.GBP += convertedAmt;
        if (fxTo === 'JPY') targetCurState.JPY += convertedAmt;
        setCurrencies(targetCurState);

        // Save FX swap Transaction
        await storageService.saveTransaction({
          id: Math.random().toString(36).substr(2, 9),
          accountId: account.id,
          userId: user.id,
          amount: value,
          type: 'debit',
          description: `FX Swap: USD to ${fxTo} Exchange (Converted $${value.toLocaleString()} to ${convertedAmt.toLocaleString()} ${fxTo})`,
          status: 'completed',
          reference_id: `FEX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          created_at: new Date().toISOString()
        });

        // Insert notification
        await storageService.saveNotification({
          id: Math.random().toString(36).substr(2, 9),
          userId: user.id,
          title: 'FX Conversion Complete',
          message: `Swapped $${value.toLocaleString()} USD into ${convertedAmt.toLocaleString()} ${fxTo} securely.`,
          type: 'transaction',
          isRead: false,
          createdAt: new Date().toISOString()
        });

        // Refresh list
        const refreshedTX = await storageService.getTransactionsByAccountId(account.id, user.id);
        setTransactions(refreshedTX.sort((a, b) => new Date(b.createdAt || b.created_at || '').getTime() - new Date(a.createdAt || a.created_at || '').getTime()));

        setFxAmount('');
        toast.success(`SWAPPED $${value} USD SECURELY FOR ${convertedAmt} ${fxTo}!`);
      } catch (err) {
        toast.error("FX SWAP LEDGER REJECTED THE COMPLIANCE CHAIN");
      } finally {
        setIsFxSwapping(false);
      }
    } else {
      // Swapping from other currencies EUR/GBP back to USD
      const sourceBalance = fxFrom === 'EUR' ? currencies.EUR : currencies.GBP;
      if (sourceBalance < value) {
        toast.error(`INSUFFICIENT ${fxFrom} SYSTEM LEVEL RESERVES`);
        return;
      }

      setIsFxSwapping(true);
      try {
        const rateKey = `${fxFrom}USD`;
        const conversionRate = rates[rateKey] || 1;
        const USDReceived = Number((value * conversionRate).toFixed(2));

        // Adding to account USD balance
        const nextBalance = account.balance + USDReceived;
        const updatedAccount = { ...account, balance: nextBalance };
        await storageService.saveAccount(updatedAccount);
        setAccount(updatedAccount);

        // Update ledger state locally
        const targetCurState = { ...currencies };
        targetCurState.USD = nextBalance;
        if (fxFrom === 'EUR') targetCurState.EUR -= value;
        if (fxFrom === 'GBP') targetCurState.GBP -= value;
        setCurrencies(targetCurState);

        // Save FX credit transaction
        await storageService.saveTransaction({
          id: Math.random().toString(36).substr(2, 9),
          accountId: account.id,
          userId: user.id,
          amount: USDReceived,
          type: 'credit',
          description: `FX Liquidation: ${fxFrom} to USD Spot (Cleared ${value.toLocaleString()} ${fxFrom} for $${USDReceived.toLocaleString()})`,
          status: 'completed',
          reference_id: `FEX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          created_at: new Date().toISOString()
        });

        // Sync list
        const refreshedTX = await storageService.getTransactionsByAccountId(account.id, user.id);
        setTransactions(refreshedTX.sort((a, b) => new Date(b.createdAt || b.created_at || '').getTime() - new Date(a.createdAt || a.created_at || '').getTime()));

        setFxAmount('');
        toast.success(`RECEIVED $${USDReceived} USD FROM SWAPPING ${value} ${fxFrom}!`);
      } catch (err) {
        toast.error("FX SWAP REGISTER ERROR.");
      } finally {
        setIsFxSwapping(false);
      }
    }
  };

  // Buy & Sell Live Market Arbitrage
  const handleMarketTrading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !user) return;
    const value = parseFloat(tradeAmount);
    if (isNaN(value) || value <= 0) {
      toast.error("INVALID TRADING CAPITAL SPECIFIED");
      return;
    }

    if (!tradePin) {
      toast.error("SECURITY PIN VERIFICATION IS MANDATORY");
      return;
    }

    const correctPin = user.transactionPin;
    if (correctPin && tradePin !== correctPin) {
      toast.error("INVALID TRANSACTION SECURE PIN. AUTHORIZATION REFUSED.");
      return;
    }

    const activeAssetPrice = livePrices[tradeAsset];
    const rawAssetQty = value / activeAssetPrice;
    const fee = 1.50; // secure clearing markup

    if (tradeType === 'buy') {
      const totalCost = value + fee;
      if (account.balance < totalCost) {
        toast.error("INSUFFICIENT BALANCE TO CLEAR PRINCIPAL AND SECURE REGISTRY FEE");
        return;
      }

      setIsTrading(true);
      try {
        const updatedBalance = account.balance - totalCost;
        const updatedAccount = { ...account, balance: updatedBalance };
        await storageService.saveAccount(updatedAccount);
        setAccount(updatedAccount);

        // Modify holdings and save
        const nextHoldings = {
          ...holdings,
          [tradeAsset]: Number((holdings[tradeAsset] + rawAssetQty).toFixed(5))
        };
        setHoldings(nextHoldings);
        localStorage.setItem(`econest_holdings_${user.id}`, JSON.stringify(nextHoldings));

        // Create transaction of type 'debit'
        await storageService.saveTransaction({
          id: Math.random().toString(36).substr(2, 9),
          accountId: account.id,
          userId: user.id,
          amount: value,
          type: 'debit',
          description: `Buy Ledger asset Spot: ${rawAssetQty.toFixed(5)} units of ${tradeAsset} @ $${activeAssetPrice.toLocaleString()}`,
          status: 'completed',
          reference_id: `MKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          created_at: new Date().toISOString()
        });

        // Send notifications
        await storageService.saveNotification({
          id: Math.random().toString(36).substr(2, 9),
          userId: user.id,
          title: 'Blockchain Asset Acquired',
          message: `Your buy order of ${rawAssetQty.toFixed(5)} ${tradeAsset} for $${value.toLocaleString()} USD was cleared instantly.`,
          type: 'transaction',
          isRead: false,
          createdAt: new Date().toISOString()
        });

        // Refresh transactions list
        const refreshedTX = await storageService.getTransactionsByAccountId(account.id, user.id);
        setTransactions(refreshedTX.sort((a, b) => new Date(b.createdAt || b.created_at || '').getTime() - new Date(a.createdAt || a.created_at || '').getTime()));

        setTradeAmount('');
        setTradePin('');
        toast.success(`SECURE BLOCKCHAIN CLEARANCE SUCCESSFUL. BOUGHT ${rawAssetQty.toFixed(5)} ${tradeAsset}!`);
      } catch (err) {
        toast.error("TRANSACTION FAILED TO ENGAGE BLOCKS");
      } finally {
        setIsTrading(false);
      }
    } else {
      // SELLING HOLDINGS
      const currentAssetWalletBalance = holdings[tradeAsset];
      if (currentAssetWalletBalance < rawAssetQty) {
        toast.error(`INSUFFICIENT ASSET VOLUME. YOU OWN ${currentAssetWalletBalance.toFixed(5)} ${tradeAsset}`);
        return;
      }

      setIsTrading(true);
      try {
        const netValueReceived = value - fee;
        const updatedBalance = account.balance + netValueReceived;
        const updatedAccount = { ...account, balance: updatedBalance };
        await storageService.saveAccount(updatedAccount);
        setAccount(updatedAccount);

        // Modify holdings and save
        const nextHoldings = {
          ...holdings,
          [tradeAsset]: Number((holdings[tradeAsset] - rawAssetQty).toFixed(5))
        };
        setHoldings(nextHoldings);
        localStorage.setItem(`econest_holdings_${user.id}`, JSON.stringify(nextHoldings));

        // Create transaction of type 'credit'
        await storageService.saveTransaction({
          id: Math.random().toString(36).substr(2, 9),
          accountId: account.id,
          userId: user.id,
          amount: netValueReceived,
          type: 'credit',
          description: `Liquidate Ledger Asset units: ${rawAssetQty.toFixed(5)} units of ${tradeAsset} @ $${activeAssetPrice.toLocaleString()}`,
          status: 'completed',
          reference_id: `MKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          created_at: new Date().toISOString()
        });

        // Send notification
        await storageService.saveNotification({
          id: Math.random().toString(36).substr(2, 9),
          userId: user.id,
          title: 'Asset Liquidated Successfully',
          message: `Liquidated ${rawAssetQty.toFixed(5)} ${tradeAsset} and received $${netValueReceived.toLocaleString()} USD back on balance.`,
          type: 'transaction',
          isRead: false,
          createdAt: new Date().toISOString()
        });

        // Refresh transactions list
        const refreshedTX = await storageService.getTransactionsByAccountId(account.id, user.id);
        setTransactions(refreshedTX.sort((a, b) => new Date(b.createdAt || b.created_at || '').getTime() - new Date(a.createdAt || a.created_at || '').getTime()));

        setTradeAmount('');
        setTradePin('');
        toast.success(`ORDER REGISTRY DECLARED SUCCEEDED. SOLD ${rawAssetQty.toFixed(5)} ${tradeAsset}!`);
      } catch (err) {
        toast.error("LIQUIDATION LEDGER FAILED.");
      } finally {
        setIsTrading(false);
      }
    }
  };

  if (isLoading) return (
    <div className="animate-pulse space-y-8">
      <div className="h-32 bg-slate-200 rounded-3xl w-full"></div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="h-24 bg-slate-200 rounded-xl"></div>
        <div className="h-24 bg-slate-200 rounded-xl"></div>
        <div className="h-24 bg-slate-200 rounded-xl"></div>
      </div>
    </div>
  );

  // Dynamic Charting calculations based on accounts
  const chartData = [
    { name: 'Mon', Spending: 240, Income: 1200, Savings: 300 },
    { name: 'Tue', Spending: 480, Income: 800, Savings: 450 },
    { name: 'Wed', Spending: 150, Income: 2400, Savings: 500 },
    { name: 'Thu', Spending: 720, Income: 950, Savings: 320 },
    { name: 'Fri', Spending: 390, Income: 1300, Savings: 800 },
    { name: 'Sat', Spending: 910, Income: 1100, Savings: 1200 },
    { name: 'Sun', Spending: 180, Income: 3100, Savings: 1500 }
  ];

  // Dynamic calculated pie chart categories representing real cash outgoings
  const spentSummaryData = [
    { name: 'Capital Transfer', value: transactions.filter(t => t.type === 'debit' && t.description.includes('Transfer')).reduce((sum, tx) => sum + tx.amount, 0) || 1200, color: '#059669' },
    { name: 'Core Utilities', value: transactions.filter(t => t.description.includes('Utility') || t.description.includes('Bill')).reduce((sum, tx) => sum + tx.amount, 0) || 350, color: '#3b82f6' },
    { name: 'Market Investments', value: transactions.filter(t => t.description.includes('Asset') || t.description.includes('Spot')).reduce((sum, tx) => sum + tx.amount, 0) || 680, color: '#eab308' },
    { name: 'Vault Allocations', value: transactions.filter(t => t.description.includes('Vault')).reduce((sum, tx) => sum + tx.amount, 0) || 500, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Profile Info Card Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
        <div className="w-24 h-24 bg-emerald-100 rounded-2xl border-4 border-white shadow-lg overflow-hidden flex-shrink-0 relative group">
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UserIcon className="h-10 w-10 text-emerald-600" />
            </div>
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
            <h2 className="text-2xl font-bold text-slate-900 leading-none">{user?.fullName}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase uppercase flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Gold Tier Client
            </span>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 mt-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-emerald-600" />
              <span>Country: <strong className="text-slate-700">{user?.country || 'N/A'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>City: <strong className="text-slate-700">{user?.city || 'N/A'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <span>Age: <strong className="text-slate-700">{user?.age ? `${user.age} yrs` : 'N/A'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-emerald-600" />
              <span>Identity: <strong className="text-slate-700">{user?.email || 'N/A'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Virtual Debit Card Interface */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative group">
          <div className="bg-gradient-to-tr from-[#021c16] via-[#092d24] to-[#113a30] rounded-[2rem] p-5 sm:p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-950/45 aspect-auto sm:aspect-[1.586/1] min-h-[300px] sm:min-h-0 w-full max-w-2xl mx-auto flex flex-col justify-between border border-emerald-500/20 ring-1 ring-emerald-500/10 select-none hover:shadow-emerald-950/60 transition-all duration-500">
            {/* Fine laser-etched decorative concentric vector ripples for authentic security styling */}
            <div className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-overlay">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <circle cx="20" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="20" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.3" />
                <circle cx="20" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.2" />
                <circle cx="80" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="80" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.3" />
                <circle cx="50" cy="50" r="60" fill="none" stroke="currentColor" strokeWidth="0.2" />
                <path d="M0,50 Q25,30 50,50 T100,50" fill="none" stroke="currentColor" strokeWidth="0.4" />
                <path d="M0,45 Q25,25 50,45 T100,45" fill="none" stroke="currentColor" strokeWidth="0.2" />
              </svg>
            </div>

            {/* Futuristic physical Card Edge highlight and gloss sheen */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none rounded-[2rem]"></div>
            <div className="absolute inset-[1px] border border-white/5 rounded-[1.95rem] pointer-events-none"></div>

            {/* Card Header Panel */}
            <div className="relative z-10 flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md shadow-emerald-950/50">
                    <Send className="h-4 w-4 text-white rotate-45 transform" />
                  </div>
                  <div>
                    <span className="font-sans font-black tracking-[0.2em] text-sm sm:text-base text-white">ECONEST</span>
                    <span className="text-[9px] font-bold text-emerald-400 tracking-[0.05em] ml-1.5 uppercase">LEDGER</span>
                  </div>
                </div>
                <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Virtual Sovereign World Asset Card</p>
              </div>

              {/* Secure holographic label */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right pr-1">
                  <p className="text-[8px] font-black text-amber-400/90 tracking-widest uppercase">WORLD ELITE</p>
                  <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">Debit Custody</p>
                </div>
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500/25 via-teal-400/35 to-amber-400/25 flex items-center justify-center border border-white/15 overflow-hidden shadow-inner backdrop-blur-sm group-hover:scale-105 transition-all">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-500/20 via-sky-300/30 to-amber-300/25 font-mono text-[7px] flex items-center justify-center font-black text-white/50 select-none">
                    SECURE
                  </div>
                </div>
              </div>
            </div>

            {/* Card EMV Micro-Chip & Contactless waves */}
            <div className="relative z-10 flex items-center justify-between mt-3 sm:mt-6">
              {/* Gold Plated EMV Chip */}
              <div className="w-[52px] h-[40px] rounded-lg bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-300 relative border border-amber-600/40 overflow-hidden shadow-lg shadow-black/20">
                {/* Authentic laser layout inside chip */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[0.5px] bg-yellow-900/40"></div>
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[0.5px] bg-yellow-900/40"></div>
                <div className="absolute inset-[6px] border border-yellow-800/20 rounded-[2px]"></div>
                <div className="absolute left-[13px] top-0 bottom-0 w-[0.5px] bg-yellow-900/40"></div>
                <div className="absolute right-[13px] top-0 bottom-0 w-[0.5px] bg-yellow-900/40"></div>
                {/* Inner micro solder points */}
                <div className="absolute left-[6px] top-1/2 -translate-y-1/2 w-3 h-2.5 bg-amber-400/20 rounded-sm"></div>
                <div className="absolute right-[6px] top-1/2 -translate-y-1/2 w-3 h-2.5 bg-amber-400/20 rounded-sm"></div>
              </div>

              {/* Contactless Radio Wave Signal */}
              <div className="flex items-center gap-1 opacity-70">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                <div className="w-[3px] h-3 border-r-2 border-slate-300 rounded-full"></div>
                <div className="w-[3px] h-4.5 border-r-2 border-slate-300 rounded-full"></div>
                <div className="w-[3px] h-6 border-r-2 border-slate-300 rounded-full"></div>
              </div>
            </div>

            {/* Card ID Line - Styled with embossed tactile font feel */}
            <div className="relative z-10 mt-4">
              <p className="text-[7px] sm:text-[8px] text-slate-500 uppercase tracking-[0.25em] font-black pb-0.5 opacity-80">Primary Security Account Number</p>
              <div className="flex items-center gap-4">
                <p 
                  className="font-mono text-lg sm:text-2xl md:text-3xl tracking-[0.12em] text-white select-all drop-shadow-[0_2px_1px_rgba(0,0,0,0.85)] font-bold"
                  style={{ textShadow: "0px 1.5px 1px rgba(0, 0, 0, 0.95), 0px -0.5px 0.5px rgba(255,255,255,0.15)" }}
                >
                  {((account?.accountNumber || "8175861144219358").padEnd(16, "0")).replace(/(\d{4})/g, '$1 ').trim()}
                </p>
              </div>
            </div>

            {/* Expiry Date Info Section */}
            <div className="relative z-10 flex items-center gap-6 mt-1 sm:mt-2">
              <div className="flex items-center gap-1.5">
                <div className="text-[5px] sm:text-[6px] font-black text-slate-500 uppercase leading-[7px] tracking-wider text-right">
                  VALID<br />FROM
                </div>
                <span className="font-mono text-xs text-slate-300 font-bold tracking-widest">06 / 26</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="text-[5px] sm:text-[6px] font-black text-slate-500 uppercase leading-[7px] tracking-wider text-right">
                  GOOD<br />THRU
                </div>
                <span 
                  className="font-mono text-xs text-white font-bold tracking-widest drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
                  style={{ textShadow: "0px 1px 1px rgba(0, 0, 0, 0.95)" }}
                >
                  08 / 31
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[6px] font-black text-slate-500 tracking-wider uppercase">CVV</span>
                <span className="font-mono text-[10px] text-slate-400 font-bold bg-slate-950/40 px-1.5 py-0.5 rounded border border-white/5">***</span>
              </div>
            </div>

            {/* Card Bottom Panel with Holder Name and Available Balance */}
            <div className="relative z-10 flex justify-between items-end mt-4 pt-2 border-t border-emerald-500/10 gap-4">
              <div className="space-y-0.5">
                <p className="text-[7px] sm:text-[8px] text-slate-500 uppercase tracking-widest font-black opacity-80">Primary Account Custodian</p>
                <p 
                  className="text-xs sm:text-base font-bold tracking-wider text-emerald-100 uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
                  style={{ textShadow: "0px 1.2px 1px rgba(0, 0, 0, 0.95)" }}
                >
                  {user?.fullName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[7px] sm:text-[8px] text-slate-500 uppercase tracking-widest font-black opacity-80 mb-0.5">Book Balance Level</p>
                <div className="flex items-baseline justify-end gap-1 font-mono">
                  <span className="text-xs font-bold text-emerald-400">$</span>
                  <span className="text-base sm:text-2xl font-black text-emerald-400 tracking-tight">
                    {account?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[8px] text-slate-400 font-sans font-black ml-0.5 uppercase">USD</span>
                </div>
              </div>
            </div>

            {/* Overlay watermark details */}
            <div className="absolute top-1/2 left-1/3 p-12 opacity-[0.015] pointer-events-none transform -translate-y-1/2">
              <ShieldCheck className="h-60 w-60" />
            </div>
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>
          </div>
          <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-transparent rounded-[2.1rem] blur-md opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-300 pointer-events-none"></div>
        </div>

        {/* Quick Utilities Hub */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Transfer Gateways
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Link 
                to="/dashboard/transfers"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all group shadow-sm"
              >
                <Send className="h-6 w-6 text-slate-600 group-hover:text-emerald-600 mb-2" />
                <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700">Send Capital</span>
              </Link>
              <Link 
                to="/dashboard/loans"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-amber-50 hover:border-amber-200 transition-all group shadow-sm"
              >
                <Banknote className="h-6 w-6 text-slate-600 group-hover:text-amber-600 mb-2" />
                <span className="text-xs font-bold text-slate-700 group-hover:text-amber-700">Apply Loan</span>
              </Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Secure Signal Strength</p>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Active Firewall Enabled
              </span>
              <span className="text-[10px] font-mono text-slate-400">EN-GATE-4290</span>
            </div>
          </div>
        </div>
      </div>

      {/* NEW SECTION: High-Fidelity Bank Live Spending Chart and Distribution Analyzers */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cashflow Waveform AreaChart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wider border border-indigo-100">
                Live Metrics Console
              </span>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-1">
                Econest Realtime Cashflow Analyzer
              </h3>
              <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">
                Monitoring multi-channel micro-transaction velocities on master ledger
              </p>
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
              <span className="px-3 py-1 text-xs font-black rounded-lg bg-white text-slate-800 shadow-sm cursor-default">
                7 Days Waves
              </span>
              <span className="px-3 py-1 text-xs font-medium text-slate-500 cursor-not-allowed uppercase">
                Month-View
              </span>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                  labelStyle={{ fontWeight: 'black', textTransform: 'uppercase', color: '#94a3b8', fontSize: '10px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                <Area type="monotone" name="Inflow Volume" dataKey="Income" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" name="Outflow Limit" dataKey="Spending" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorSpending)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Category Burn Breakdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 uppercase tracking-wildest border border-emerald-100">
              Sector Allocation
            </span>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-1">
              Outgoing Sectors
            </h3>
            <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">
              Live classified debit distribution percentage
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center py-2">
            <div className="w-full space-y-4">
              {spentSummaryData.map((item, index) => {
                const totalVal = spentSummaryData.reduce((acc, curr) => acc + curr.value, 0);
                const percent = Math.round((item.value / totalVal) * 100);

                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                        {item.name}
                      </span>
                      <span className="font-mono text-slate-900 font-black">
                        ${item.value.toLocaleString()} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${percent}%`, backgroundColor: item.color }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Estimated Compound APY</p>
            <p className="text-xl font-black text-slate-800">5.50% Weighted Average</p>
          </div>
        </div>
      </div>

      {/* Interactive Live Market Trading Panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-4 border-b border-slate-150">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 uppercase border border-rose-100">
                🔴 LIVE ARBITRAGE TERMINAL
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Crypto & Precious Metals Brokerage
            </h3>
            <p className="text-xs text-slate-500 font-medium uppercase mt-1">
              Analyze markets via TradingView advanced charts, toggle dragging surface to lock/unlock scroll protection, execute instant trades
            </p>
          </div>
          
          {/* Surface Drag Control Toggle */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit self-start lg:self-auto">
            <span className="text-xs font-bold text-slate-500 px-2 uppercase">Chart Interactivity:</span>
            <button 
              onClick={() => {
                setIsChartLocked(true);
                toast.success("Page scroll mode active. Dragging blocked on chart surface.");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${isChartLocked ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 bg-transparent'}`}
            >
              <Lock className="h-3.5 w-3.5" />
              Easy Scroll (Locked)
            </button>
            <button 
              onClick={() => {
                setIsChartLocked(false);
                toast.success("Interactive mode active. Dragging enabled inside chart surface.");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${!isChartLocked ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 bg-transparent'}`}
            >
              <Unlock className="h-3.5 w-3.5" />
              Free Drag
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* Chart Workspace (Locked or Unlocked for Drag Interaction) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative h-[380px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-inner">
              
              {/* Overlay Indicator if Scroll Lock is Active */}
              {isChartLocked && (
                <div className="absolute inset-0 bg-transparent z-[20] pointer-events-auto cursor-default flex items-center justify-center">
                  {/* Subtle, smart visual alert to educate users */}
                  <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase text-slate-100 border border-white/10 shadow-lg flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-emerald-400" />
                    <span>Scroll Lock Active (Drag Prevented)</span>
                  </div>
                </div>
              )}
              
              <div className={`w-full h-[410px] ${isChartLocked ? 'pointer-events-none opacity-90' : 'pointer-events-auto'}`}>
                <TradingChart />
              </div>
            </div>

            {/* Asset Portfolio Position Holdings Box */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-3">
              <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-emerald-600" />
                Your Settled Investment Positions
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                <div className="bg-white p-3 rounded-xl border border-slate-150">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Bitcoin Position</p>
                  <p className="text-sm font-black text-slate-800 font-mono mt-0.5">{holdings.BTC} BTC</p>
                  <p className="text-[11px] font-bold text-slate-500 mt-1">${(holdings.BTC * livePrices.BTC).toLocaleString(undefined, { maximumFractionDigits: 2 })} Value</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-150">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Ethereum Position</p>
                  <p className="text-sm font-black text-slate-800 font-mono mt-0.5">{holdings.ETH} ETH</p>
                  <p className="text-[11px] font-bold text-slate-500 mt-1">${(holdings.ETH * livePrices.ETH).toLocaleString(undefined, { maximumFractionDigits: 2 })} Value</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-150">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Solana Position</p>
                  <p className="text-sm font-black text-slate-800 font-mono mt-0.5">{holdings.SOL} SOL</p>
                  <p className="text-[11px] font-bold text-slate-500 mt-1">${(holdings.SOL * livePrices.SOL).toLocaleString(undefined, { maximumFractionDigits: 2 })} Value</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-150">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Spot Gold Bullion</p>
                  <p className="text-sm font-black text-slate-800 font-mono mt-0.5">{holdings.GLD} oz</p>
                  <p className="text-[11px] font-bold text-slate-500 mt-1">${(holdings.GLD * livePrices.GLD).toLocaleString(undefined, { maximumFractionDigits: 2 })} Value</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Buy / Sell Order Desk Box */}
          <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 shadow-inner space-y-5">
            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Order Execution Desk</h4>
              <p className="text-[11px] text-slate-500 font-semibold uppercase mt-0.5">Instant Liquidity Settlement</p>
            </div>

            {/* Asset Selection Tickers with flashing prices */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { sym: 'BTC', label: 'Bitcoin' },
                { sym: 'ETH', label: 'Ethereum' },
                { sym: 'SOL', label: 'Solana' },
                { sym: 'GLD', label: 'Gold Spot' }
              ].map((item) => {
                const symbol = item.sym;
                const isSelected = tradeAsset === symbol;
                const price = livePrices[symbol as keyof typeof livePrices];
                const prevPrice = prevPrices[symbol as keyof typeof prevPrices];
                const isPriceUp = price >= prevPrice;

                return (
                  <button
                    key={symbol}
                    onClick={() => setTradeAsset(symbol as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${isSelected ? 'bg-white border-slate-900 shadow-md ring-1 ring-slate-900' : 'bg-white/60 border-slate-200 hover:bg-white'}`}
                  >
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                      <span>{symbol}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">{item.label}</p>
                    <p className={`text-xs font-mono font-black mt-1 transition-colors duration-300 ${isPriceUp ? 'text-emerald-600 animate-pulse' : 'text-red-500 animate-pulse'}`}>
                      ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: symbol === 'SOL' ? 3 : 2 })}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Buy / Sell Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-200 rounded-xl">
              <button
                onClick={() => setTradeType('buy')}
                className={`py-2 text-xs font-black uppercase rounded-lg transition-all ${tradeType === 'buy' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800 bg-transparent'}`}
              >
                Buy (Long)
              </button>
              <button
                onClick={() => setTradeType('sell')}
                className={`py-2 text-xs font-black uppercase rounded-lg transition-all ${tradeType === 'sell' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800 bg-transparent'}`}
              >
                Sell (Short)
              </button>
            </div>

            {/* Trade Submission Form */}
            <form onSubmit={handleMarketTrading} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">USD Trade Capital Value</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-slate-400 font-bold">$</span>
                  </div>
                  <input
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    placeholder="Enter USD Amount (eg. 250)"
                    min="10"
                    className="w-full pl-8 pr-12 py-3 bg-white border border-slate-250 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                    <span className="text-[10px] font-black text-slate-400">USD</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Secure Transaction Pin</label>
                <input
                  type="password"
                  maxLength={6}
                  value={tradePin}
                  onChange={(e) => setTradePin(e.target.value)}
                  placeholder="6-digit Authorized Pin"
                  className="w-full px-3.5 py-3 bg-white border border-slate-250 rounded-xl text-sm font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 text-center"
                  required
                />
              </div>

              {/* Order Calculations Info */}
              {tradeAmount && !isNaN(parseFloat(tradeAmount)) && (
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Asset Amount to {tradeType === 'buy' ? 'Receive' : 'Deduct'}</span>
                    <strong className="text-slate-900">
                      {(parseFloat(tradeAmount) / livePrices[tradeAsset]).toFixed(5)} {tradeAsset}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Secure Clearing Surcharge</span>
                    <strong className="text-slate-900">$1.50 USD</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1.5 font-bold text-slate-800">
                    <span>Total Settle Book Cost</span>
                    <strong className="text-slate-900">
                      ${(parseFloat(tradeAmount) + (tradeType === 'buy' ? 1.50 : -1.50)).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                    </strong>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isTrading}
                className={`w-full py-3.5 rounded-xl text-xs font-black uppercase text-white shadow-md transition-all flex items-center justify-center gap-2 ${tradeType === 'buy' ? 'bg-emerald-605 bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-605 bg-rose-600 hover:bg-rose-700'}`}
              >
                {isTrading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Clearing Ledger Node...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Execute {tradeType === 'buy' ? 'BUY' : 'SELL'} Asset Order
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* NEW DOWN BELOW FEATURES: HYS Vaults compounter, Foreign Exchange swapper, Utility Settlements */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Savings Vault Section with Dynamic Funding & Unlocking */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 text-purple-700 uppercase tracking-widest border border-purple-100">
              Goal Sub-ledgers
            </span>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-1.5">
              <Target className="h-5 w-5 text-purple-600" />
              High-Yield Savings Vaults
            </h3>
            <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">
              Lock money away into active compound-interest buckets
            </p>
          </div>

          <div className="space-y-4 my-2">
            {vaults.map((v) => {
              const progress = Math.min(Math.round((v.saved / v.target) * 100), 100);
              return (
                <div key={v.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{v.name}</p>
                      <p className="text-[10px] text-purple-600 uppercase font-black tracking-wide mt-0.5">{v.apy} Guaranteed</p>
                    </div>
                    <span className="text-[10px] font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200/60 shadow-sm">
                      {progress}%
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full transition-all duration-700" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                      <span>Saved: ${v.saved.toLocaleString()}</span>
                      <span>Target: ${v.target.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Interactive Mini Funding Bar */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => {
                        const amtStr = prompt(`Enter capital to move from USD balance to "${v.name}":`, "500");
                        if (amtStr) {
                          const amt = parseFloat(amtStr);
                          handleFundVault(v.id, amt);
                        }
                      }}
                      className="flex-1 py-1.5 bg-white hover:bg-purple-50 text-[10px] font-black uppercase text-purple-700 border border-purple-200 rounded-lg transition-all"
                    >
                      Fund Bolt
                    </button>
                    <button
                      onClick={() => {
                        const amtStr = prompt(`Enter capital to release from "${v.name}" back to main USD balance:`, "500");
                        if (amtStr) {
                          const amt = parseFloat(amtStr);
                          handleWithdrawVault(v.id, amt);
                        }
                      }}
                      className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase text-slate-600 rounded-lg transition-all"
                    >
                      Release
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-slate-400 font-bold uppercase text-center flex items-center justify-center gap-1 leading-relaxed">
            <Info className="h-3 w-3 text-purple-500" />
            Compounding processed dynamically on Econest Nodes
          </div>
        </div>

        {/* Global FX Spot Forex Multi-Currency swap */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 uppercase tracking-widest border border-amber-100">
              International FX
            </span>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-1.5">
              <Coins className="h-5 w-5 text-amber-600" />
              Interbank FX Exchange
            </h3>
            <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">
              Convert your primary check balance back and forth instantly
            </p>
          </div>

          {/* Currency holdings board */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2.5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Forex Balances</p>
            <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-700 pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-black text-slate-400">🇺🇸 USD</span>
                <p className="text-slate-900 font-mono mt-0.5">${(account?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-black text-slate-400">🇪🇺 EUR</span>
                <p className="text-slate-900 font-mono mt-0.5">€{currencies.EUR.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-black text-slate-400">🇬🇧 GBP</span>
                <p className="text-slate-900 font-mono mt-0.5">£{currencies.GBP.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-black text-slate-400">🇯🇵 JPY</span>
                <p className="text-slate-900 font-mono mt-0.5">¥{currencies.JPY.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Quick Swap Widget */}
          <form onSubmit={handleFXSwap} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Exchange From</label>
                <select
                  value={fxFrom}
                  onChange={(e) => setFxFrom(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Convert To</label>
                <select
                  value={fxTo}
                  onChange={(e) => setFxTo(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                >
                  {fxFrom !== 'EUR' && <option value="EUR">EUR (€)</option>}
                  {fxFrom !== 'GBP' && <option value="GBP">GBP (£)</option>}
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Swap Amount</label>
              <input
                type="number"
                value={fxAmount}
                onChange={(e) => setFxAmount(e.target.value)}
                placeholder="Convert Amount..."
                className="w-full p-2.5 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-850"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isFxSwapping}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {isFxSwapping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Commit conversion Spot Order
            </button>
          </form>
        </div>

        {/* Dynamic Utilities Bill Clearwater center */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 uppercase tracking-widest border border-blue-100">
              Micro-Invoicing
            </span>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-1.5">
              <Tv className="h-5 w-5 text-blue-600" />
              Instant Bill Clearer
            </h3>
            <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">
              Pay monthly utility debits instantly out of book credit
            </p>
          </div>

          <div className="space-y-3.5 my-2">
            {bills.map((bill) => (
              <div key={bill.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-150 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800">{bill.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{bill.dueDate} • ${bill.amount.toFixed(2)}</p>
                </div>
                {bill.isPaid ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase border border-emerald-100 font-semibold">
                    <Check className="h-3.5 w-3.5" /> Settled
                  </span>
                ) : (
                  <button
                    onClick={() => handlePayBill(bill.id)}
                    className="px-3 py-1.5 bg-blue-650 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase rounded-lg transition-all shadow-sm"
                  >
                    Clear Now
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 font-medium text-center flex items-center justify-center gap-1.5 leading-relaxed">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Autonomous clearing powered by Econest Node
          </div>
        </div>

      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            Live Transaction Log
          </h3>
          <Link 
            to="/dashboard/history"
            className="text-xs font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-wider"
          >
            Check Complete Statement History
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {transactions.slice(0, 5).map((tx) => (
            <div key={tx.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-150 hover:border-emerald-200 transition-all flex flex-col justify-between h-[120px]">
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  tx.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                }`}>
                  {tx.type === 'credit' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <p className={`text-sm font-black font-mono ${
                  tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                }`}>
                  {tx.type === 'credit' ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="mt-2 text-left">
                <p className="text-xs font-black text-slate-800 truncate" title={tx.description}>{tx.description}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                  {safeFormat(tx.createdAt || tx.created_at, 'MMM dd, HH:mm')}
                </p>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-500 text-sm font-medium uppercase">
              No recent transactions found on the ledger.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
