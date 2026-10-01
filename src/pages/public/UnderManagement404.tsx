import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Lock, Server, RefreshCw, KeyRound, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UnderManagement404Props {
  onBypass?: () => void;
}

const UnderManagement404: React.FC<UnderManagement404Props> = ({ onBypass }) => {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [clickCount, setClickCount] = useState(0);
  const [currentTimestamp, setCurrentTimestamp] = useState(new Date().toUTCString());
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimestamp(new Date().toUTCString());
    }, 1000);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut Ctrl+Shift+M or Cmd+Shift+M to toggle admin unlock modal
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setShowAdminModal(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSecretClick = () => {
    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    if (nextCount >= 5) {
      setShowAdminModal(true);
      setClickCount(0);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // Allow master passkey or if user is already admin
    if (adminKey === 'admin123' || adminKey === 'econest2026' || adminKey === 'unlock' || user?.role === 'admin') {
      localStorage.setItem('econest_bypass_lock', 'true');
      if (onBypass) {
        onBypass();
      } else {
        window.location.reload();
      }
    } else {
      setErrorMsg('Invalid administrative key.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-rose-500 selection:text-white font-mono antialiased">
      {/* Top Warning Strip */}
      <div className="bg-rose-950/80 border-b border-rose-800/60 px-4 py-2 text-center text-xs font-semibold text-rose-300 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
        <span>HTTP 404 - SYSTEM SUSPENDED UNDER ADMINISTRATIVE MANAGEMENT</span>
      </div>

      {/* Main Error Content */}
      <div className="max-w-3xl w-full mx-auto px-6 py-16 flex flex-col items-center text-center">
        {/* Big Status Badge */}
        <div 
          onClick={handleSecretClick}
          className="cursor-pointer select-none relative group mb-8"
          title="Incident Management Badge"
        >
          <div className="w-24 h-24 rounded-2xl bg-rose-950/60 border-2 border-rose-500/40 flex items-center justify-center shadow-2xl shadow-rose-950/50 backdrop-blur-sm group-hover:border-rose-400 transition-all">
            <ShieldAlert className="w-12 h-12 text-rose-500 animate-pulse" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-slate-700 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
            LOCK-404
          </div>
        </div>

        {/* 404 Heading */}
        <h1 className="text-7xl sm:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500">
          404
        </h1>

        <h2 className="text-xl sm:text-2xl font-bold text-rose-400 mt-2 tracking-tight">
          PORTAL UNAVAILABLE — UNDER MANAGEMENT
        </h2>

        <p className="text-slate-400 text-sm sm:text-base max-w-xl mt-4 leading-relaxed font-sans">
          This banking portal and its endpoints are currently suspended under urgent administrative management and system maintenance. Public access, customer browsing, and transaction processing are disabled until further notice.
        </p>

        {/* Server Technical Diagnostics Box */}
        <div className="w-full mt-10 bg-slate-900/90 border border-slate-800 rounded-xl p-5 text-left text-xs font-mono shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-slate-300">DIAGNOSTIC ADVISORY REPORT</span>
            </div>
            <span className="text-[10px] bg-rose-950 text-rose-400 border border-rose-800 px-2 py-0.5 rounded font-bold">
              STATUS: BLOCKED (404)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-slate-300">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Reason</span>
              <span className="font-semibold text-rose-300">Administrative System Management</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Incident Code</span>
              <span 
                onClick={handleSecretClick}
                className="font-semibold text-slate-200 cursor-pointer hover:text-emerald-400"
              >
                ERR_MGMT_SUSPENDED_404
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Timestamp</span>
              <span className="text-slate-400">{currentTimestamp}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Host Node</span>
              <span className="text-slate-400">ECONEST-GATEWAY-CORE-EU2</span>
            </div>
            <div className="sm:col-span-2 pt-2 border-t border-slate-800/80">
              <span className="text-slate-500 block text-[10px] uppercase">System Instruction</span>
              <p className="text-slate-400 text-[11px] font-sans mt-0.5">
                Nobody may browse or interact with the banking application during this maintenance interval. Unauthorized access requests are logged under compliance protocol ISO-27001.
              </p>
            </div>
          </div>
        </div>

        {/* Action button: Retry */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-sans text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            Check System Availability
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2 font-sans">
        <div>
          &copy; {new Date().getFullYear()} ECONEST BANK. All services temporarily under administrative freeze.
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-slate-500">Security Clearance Level 4</span>
          {/* Discreet Admin Link */}
          <button
            onClick={() => setShowAdminModal(true)}
            className="text-slate-600 hover:text-slate-400 text-[11px] flex items-center gap-1 transition-colors"
            title="Administrator Override"
          >
            <KeyRound className="w-3 h-3" />
            <span>Admin Key</span>
          </button>
        </div>
      </footer>

      {/* Administrator Unlock Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative font-sans">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-950 border border-emerald-700 rounded-lg text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Administrator Bypass</h3>
                <p className="text-xs text-slate-400">Enter master key or admin pass to disable 404 lock</p>
              </div>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Management Override Key
                </label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={e => {
                    setAdminKey(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Enter key (e.g. admin123 or unlock)"
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                {errorMsg && (
                  <p className="text-xs text-rose-400 mt-1.5 font-medium">{errorMsg}</p>
                )}
                <p className="text-[11px] text-slate-500 mt-2">
                  Hint for site owner: Default bypass key is <code className="text-emerald-400">admin123</code> or <code className="text-emerald-400">unlock</code>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Unlock Website
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnderManagement404;
