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

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminCustomers from './pages/admin/Customers';
import AdminTransactions from './pages/admin/Transactions';
import AdminChat from './pages/admin/Chat';
import AdminLoans from './pages/admin/Loans';
import AdminSettings from './pages/admin/Settings';
import AdminAuditLogs from './pages/admin/AuditLogs';
import AdminPaymentMethods from './pages/admin/PaymentMethods';

const ProtectedRoute: React.FC<{ children: React.ReactNode; role?: 'admin' | 'customer' }> = ({ children, role }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

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
        </Router>
    </AuthProvider>
  );
}
