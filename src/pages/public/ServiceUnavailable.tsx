import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Clock, RefreshCw, AlertTriangle, Server, ArrowLeft, Mail } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';

interface ServiceUnavailableProps {
  onToggleMaintenance?: () => void;
}

export default function ServiceUnavailable({ onToggleMaintenance }: ServiceUnavailableProps) {
  const [retrySeconds, setRetrySeconds] = useState(60);
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Checking system status...');

  useEffect(() => {
    if (retrySeconds <= 0) return;
    const timer = setInterval(() => {
      setRetrySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [retrySeconds]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    setStatusMessage('Pinging server status endpoint...');
    try {
      const res = await fetch('/api/health');
      if (res.status === 503) {
        setStatusMessage('Server is still undergoing scheduled maintenance (503 Service Unavailable).');
      } else if (res.ok) {
        setStatusMessage('Server is back online! Redirecting...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        setStatusMessage(`Server returned status HTTP ${res.status}.`);
      }
    } catch {
      setStatusMessage('Unable to reach server. Please try again shortly.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>HTTP 503 • Service Temporarily Unavailable</span>
          </div>

          {/* Main Title */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              Scheduled System Maintenance
            </h1>
            <p className="text-slate-400 text-lg sm:text-xl max-w-lg mx-auto">
              ECONEST BANK servers are currently undergoing essential infrastructure updates. 
              Services will resume shortly.
            </p>
          </div>

          {/* Maintenance Card */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-left">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
              <div className="flex items-center gap-3">
                <Server className="h-6 w-6 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Core Banking Engine</h3>
                  <p className="text-xs text-slate-400">HTTP Status Code 503 (Service Unavailable)</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/20 text-amber-300">
                Maintenance Mode
              </span>
            </div>

            {/* Countdown / Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-mono mb-1">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span>ESTIMATED DOWNTIME</span>
                </div>
                <p className="text-lg font-bold text-white">~ 15 to 30 Minutes</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-mono mb-1">
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  <span>DATA SAFETY</span>
                </div>
                <p className="text-lg font-bold text-emerald-400">100% Protected & Encrypted</p>
              </div>
            </div>

            {/* Auto Retry Counter */}
            <div className="bg-slate-900/40 border border-slate-700/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-300 space-y-0.5 text-center sm:text-left">
                <p className="font-semibold text-white">Auto-Retry in: <span className="font-mono text-emerald-400 font-bold">{retrySeconds}s</span></p>
                <p className="text-slate-400">{statusMessage}</p>
              </div>

              <button
                onClick={handleManualCheck}
                disabled={isChecking}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 text-sm transition-all disabled:opacity-50 active:scale-95"
              >
                <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                <span>Check Status</span>
              </button>
            </div>
          </div>

          {/* Maintenance Control Banner for System Administrator */}
          {onToggleMaintenance && (
            <div className="bg-slate-800/90 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300 text-left">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>System Status: <strong className="text-amber-400 font-mono">503 MAINTENANCE ACTIVE</strong></span>
              </div>
              <button
                onClick={onToggleMaintenance}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95"
              >
                Disable Maintenance Mode (Bring Site Online)
              </button>
            </div>
          )}

          {/* Action links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-medium">
            <Link
              to="/"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Home</span>
            </Link>
            <span className="hidden sm:inline text-slate-600">•</span>
            <a
              href="mailto:support@econestbank.com"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <Mail className="h-4 w-4 text-emerald-400" />
              <span>Contact Support</span>
            </a>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-slate-800 text-center text-xs text-slate-500">
        © ECONEST BANK System Administration • 503 Service Unavailable Protection Handler
      </footer>
    </div>
  );
}
