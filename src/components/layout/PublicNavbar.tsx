import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark, Menu, X } from 'lucide-react';
import GoogleTranslate from '../common/GoogleTranslate';
import { useAuth } from '../../context/AuthContext';

const PublicNavbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user } = useAuth();

  const dashboardPath = user?.role === 'admin' ? '/admin' : '/dashboard';

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Landmark className="h-8 w-8 text-emerald-600" />
              <span className="text-xl font-bold text-slate-900 tracking-tight">MOONSTONE</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <GoogleTranslate />
            <Link to="/" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">Home</Link>
            <Link to="/about" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">About</Link>
            <Link to="/services" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">Services</Link>
            <Link to="/contact" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">Contact</Link>
            {user ? (
              <Link to={dashboardPath} className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-all shadow-sm">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">Login</Link>
                <Link to="/register" className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-all shadow-sm">Open Account</Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 py-4 px-4 space-y-4">
          <Link to="/" className="block text-slate-600 font-medium">Home</Link>
          <Link to="/about" className="block text-slate-600 font-medium">About</Link>
          <Link to="/services" className="block text-slate-600 font-medium">Services</Link>
          <Link to="/contact" className="block text-slate-600 font-medium">Contact</Link>
          {user ? (
            <Link to={dashboardPath} className="block bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-center">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="block text-slate-600 font-medium">Login</Link>
              <Link to="/register" className="block bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-center">Open Account</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default PublicNavbar;
