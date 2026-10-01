import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Services from './pages/public/Services';
import Contact from './pages/public/Contact';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import ForgotPassword from './pages/public/ForgotPassword';

// Dashboard Layouts
import CustomerLayout from './components/layout/CustomerLayout';
import AdminLayout from './components/layout/AdminLayout';

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerTransfers from './pages/customer/Transfers';
import CustomerHistory from './pages/customer/History';
import CustomerChat from './pages/customer/Chat';
import CustomerLoans from './pages/customer/Loans';
import CustomerSettings from './pages/customer/Settings';
import CustomerNotifications from './pages/customer/Notifications';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminCustomers from './pages/admin/Customers';
import AdminTransactions from './pages/admin/Transactions';
import AdminChat from './pages/admin/Chat';
import AdminLoans from './pages/admin/Loans';
import AdminSettings from './pages/admin/Settings';
import AdminAuditLogs from './pages/admin/AuditLogs';
import AdminPaymentMethods from './pages/admin/PaymentMethods';
import ErrorBoundary from './components/common/ErrorBoundary';
import AutoTranslateNotification from './components/common/AutoTranslateNotification';
import UnderManagement404 from './pages/public/UnderManagement404';

const ProtectedRoute: React.FC<{ children: React.ReactNode; role?: 'admin' | 'customer' }> = ({ children, role }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  if (user.status === 'disabled') {
    return <Navigate to="/login" />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  
  if (user) {
    if (user.status === 'disabled') {
      return <>{children}</>;
    }
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;
  }

  return <>{children}</>;
};

export default function App() {
  const [isBypassed, setIsBypassed] = React.useState<boolean>(() => {
    return localStorage.getItem('econest_bypass_lock') === 'true';
  });

  const handleReLock = () => {
    localStorage.removeItem('econest_bypass_lock');
    setIsBypassed(false);
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" />
          {!isBypassed ? (
            <UnderManagement404 onBypass={() => setIsBypassed(true)} />
          ) : (
            <>
              {/* Admin Active Bypass Banner */}
              <div className="bg-amber-500 text-slate-950 px-3 py-1 text-xs font-bold flex items-center justify-between z-50 sticky top-0 shadow-md">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
                  <span>404 Under Management Active (Public Blocked) — You are currently previewing as Authorized Admin</span>
                </div>
                <button
                  onClick={handleReLock}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors"
                >
                  Re-lock Website (404)
                </button>
              </div>

              <AutoTranslateNotification />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

                {/* Customer Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute role="customer">
                    <CustomerLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<CustomerDashboard />} />
                  <Route path="transfers" element={<CustomerTransfers />} />
                  <Route path="history" element={<CustomerHistory />} />
                  <Route path="chat" element={<CustomerChat />} />
                  <Route path="loans" element={<CustomerLoans />} />
                  <Route path="settings" element={<CustomerSettings />} />
                  <Route path="notifications" element={<CustomerNotifications />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute role="admin">
                    <AdminLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<AdminDashboard />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="transactions" element={<AdminTransactions />} />
                  <Route path="chat" element={<AdminChat />} />
                  <Route path="loans" element={<AdminLoans />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="payment-methods" element={<AdminPaymentMethods />} />
                  <Route path="audit-logs" element={<AdminAuditLogs />} />
                </Route>

                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </>
          )}
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
