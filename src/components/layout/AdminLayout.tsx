import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ArrowRightLeft, 
  MessageSquare, 
  LogOut, 
  Landmark,
  Menu,
  Settings,
  ShieldCheck,
  Banknote,
  Wallet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import NotificationCenter from '../NotificationCenter';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
    { icon: Users, label: 'Customers', path: '/admin/customers' },
    { icon: ArrowRightLeft, label: 'Transactions', path: '/admin/transactions' },
    { icon: Banknote, label: 'Loan Requests', path: '/admin/loans' },
    { icon: Wallet, label: 'Payment Methods', path: '/admin/payment-methods' },
    { icon: MessageSquare, label: 'Support Chat', path: '/admin/chat' },
    { icon: Settings, label: 'System Settings', path: '/admin/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-400 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <Link to="/" className="p-6 flex items-center gap-3">
            <Landmark className="h-8 w-8 text-emerald-500" />
            <span className="text-xl font-bold text-white tracking-tight">MOONSTONE</span>
          </Link>

          <div className="px-6 py-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit">
              <ShieldCheck className="h-3 w-3" />
              Admin Panel
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                  location.pathname === item.path 
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" 
                    : "hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all font-medium"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-8">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden flex items-center gap-2 p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <Menu className="h-6 w-6" />
            <span className="text-xs font-bold uppercase tracking-wider">Menu</span>
          </button>
          
          <div className="flex-1 lg:flex-none flex items-center justify-center gap-4">
            <div id="google_translate_element" className="scale-75 sm:scale-100"></div>
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-900">{user?.fullName}</span>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase tracking-tighter">System Administrator</span>
            </div>
            <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 overflow-hidden">
              {user?.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <ShieldCheck className="h-6 w-6 text-emerald-500" />
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
