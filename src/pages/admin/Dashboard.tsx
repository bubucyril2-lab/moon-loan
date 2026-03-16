import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Activity, 
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Megaphone,
  Send,
  Loader2,
  ArrowRight,
  ArrowRightLeft,
  Banknote,
  MessageSquare,
  ShieldAlert,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { safeFormat } from '../../utils/date';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'motion/react';

interface AdminStats {
  totalCustomers: number;
  pendingApprovals: number;
  activeAccounts: number;
  totalSystemBalance: number;
}

const AdminDashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, growthRes, logsRes] = await Promise.all([
          fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/stats/growth', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const statsData = await statsRes.json();
        const growthData = await growthRes.json();
        const logsData = await logsRes.json();

        setStats(statsData);
        setGrowthData(growthData);
        setAuditLogs(logsData);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setIsBroadcasting(true);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ message: broadcastMessage })
      });
      if (res.ok) {
        toast.success('Broadcast sent successfully');
        setBroadcastMessage('');
      }
    } catch (error) {
      toast.error('Failed to send broadcast');
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  const statCards = [
    { label: 'Total Customers', value: stats?.totalCustomers || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Pending Approvals', value: stats?.pendingApprovals || 0, icon: UserCheck, color: 'bg-amber-500' },
    { label: 'Active Accounts', value: stats?.activeAccounts || 0, icon: Activity, color: 'bg-emerald-500' },
    { label: 'System Balance', value: `$${(stats?.totalSystemBalance || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-slate-900' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome back, Admin</h2>
          <p className="text-slate-500">Here's what's happening with Moonstone Saving Bank today.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Live System Status</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
          >
            <div className="relative z-10">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform`}>
              <stat.icon className="h-12 w-12" />
            </div>
            <div className={`absolute bottom-0 left-0 h-1 w-full ${stat.color}`}></div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-600" />
          Administrative Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/admin/customers" className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-emerald-50 hover:border-emerald-100 transition-all group">
            <Users className="h-8 w-8 text-slate-600 group-hover:text-emerald-600 mb-3" />
            <span className="text-sm font-bold text-slate-600 group-hover:text-emerald-600">Manage Users</span>
          </Link>
          <Link to="/admin/transactions" className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:border-blue-100 transition-all group">
            <ArrowRightLeft className="h-8 w-8 text-slate-600 group-hover:text-blue-600 mb-3" />
            <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600">Transactions</span>
          </Link>
          <Link to="/admin/loans" className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-amber-50 hover:border-amber-100 transition-all group">
            <Banknote className="h-8 w-8 text-slate-600 group-hover:text-amber-600 mb-3" />
            <span className="text-sm font-bold text-slate-600 group-hover:text-amber-600">Loan Requests</span>
          </Link>
          <Link to="/admin/chat" className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-purple-50 hover:border-purple-100 transition-all group">
            <MessageSquare className="h-8 w-8 text-slate-600 group-hover:text-purple-600 mb-3" />
            <span className="text-sm font-bold text-slate-600 group-hover:text-purple-600">Support Center</span>
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Financial Growth
            </h3>
            <button className="text-xs font-bold text-emerald-600 hover:underline">View Report</button>
          </div>
          <div className="p-6 h-[300px]">
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                Financial growth visualization will appear here as data accumulates.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-emerald-600" />
              Broadcast Message
            </h3>
          </div>
          <div className="p-6">
            <p className="text-xs text-slate-500 mb-4">Send a message to all registered customers instantly.</p>
            <form onSubmit={handleBroadcast} className="space-y-4">
              <textarea 
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Type your announcement here..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all h-32 resize-none"
              />
              <button 
                type="submit"
                disabled={isBroadcasting || !broadcastMessage.trim()}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isBroadcasting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Broadcast
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-emerald-600" />
              Security Status
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-xs font-bold text-emerald-900">SSL Certificate</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-xs font-bold text-emerald-900">Firewall</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Running</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-xs font-bold text-slate-700">Database Backup</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">4h ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              System Logs
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {auditLogs.slice(0, 5).map((log, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4 text-slate-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-slate-900 font-medium truncate capitalize">{log.action.replace(/_/g, ' ')}</p>
                  <p className="text-[10px] text-slate-500">{log.admin_name} • {safeFormat(log.created_at, 'HH:mm')}</p>
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-4 italic">No recent logs</p>
            )}
          </div>
          <div className="p-4 border-t border-slate-100">
            <Link to="/admin/audit-logs" className="block w-full text-center py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">
              View All Audit Logs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
