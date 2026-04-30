import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  History, 
  UserCircle,
  ShieldCheck,
  Users,
  Settings
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: any;
  path: string;
}

interface MobileBottomNavProps {
  items: NavItem[];
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ items }) => {
  const location = useLocation();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 z-50 flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center min-w-[64px] py-1 rounded-xl transition-all ${
              isActive 
                ? 'text-emerald-600' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-emerald-50' : ''}`}>
              <Icon className="h-6 w-6" />
            </div>
            <span className={`text-[10px] font-bold mt-0.5 tracking-tight ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
};
