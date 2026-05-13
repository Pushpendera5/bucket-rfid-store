import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';

// Lazy load modules
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const Vendor = React.lazy(() => import('./pages/Vendor'));
const PurchaseOrder = React.lazy(() => import('./pages/PurchaseOrder'));
const GRN = React.lazy(() => import('./pages/GRN'));
const POS = React.lazy(() => import('./pages/POS'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Users = React.lazy(() => import('./pages/Users'));
const Roles = React.lazy(() => import('./pages/Roles'));

const Loader = () => (
  <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center">
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-600"></div>
  </div>
);

function App() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { darkMode } = useSelector((state) => state.ui);

  const isAdmin = user?.role === 'Administrator' || user?.role === 'Admin';

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <DashboardLayout>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Store Products & Partners */}
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/vendor" element={<Vendor />} />

          {/* Billing & Sales */}
          <Route path="/pos" element={<POS />} />

          {/* Purchasing & Receiving */}
          <Route path="/po" element={<PurchaseOrder />} />
          <Route path="/grn" element={<GRN />} />

          {/* Insights */}
          <Route path="/reports" element={<Reports />} />

          {/* Settings & Admin */}
          <Route path="/users" element={isAdmin ? <Users /> : <Navigate to="/dashboard" replace />} />
          <Route path="/roles" element={isAdmin ? <Roles /> : <Navigate to="/dashboard" replace />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
}

export default App;
