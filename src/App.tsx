
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { RequireAuth } from './components/auth/RequireAuth';
import AdminGuard from './components/auth/AdminGuard';
import Companies from './pages/Companies';
import UserManagement from './pages/UserManagement';
import Deleted from './pages/Deleted';
import Reviews from './pages/Reviews';
import Support from "./pages/Support";
import SupportDetail from "./pages/SupportDetail";
import Inventory from './pages/Inventory';
import Index from './pages/Index';
import Proposals from './pages/Proposals';
import ProposalDetail from './pages/ProposalDetail';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Clients from './pages/Clients';
import ProfilePage from './pages/Profile';
import SettingsPage from './pages/Settings';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/active-orders"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/complaints"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/completed"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/resolved"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/cancelled"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/invoice-sent"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/invoice-paid"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
           <Route
            path="/companies"
            element={
              <RequireAuth>
                <Companies />
              </RequireAuth>
            }
          />
          <Route
            path="/user-management"
            element={
              <RequireAuth>
                <UserManagement />
              </RequireAuth>
            }
          />
          <Route
            path="/deleted"
            element={
              <RequireAuth>
                <AdminGuard>
                  <Deleted />
                </AdminGuard>
              </RequireAuth>
            }
          />
           <Route
            path="/reviews"
            element={
              <RequireAuth>
                <Reviews />
              </RequireAuth>
            }
          />
          <Route
            path="/support"
            element={
              <RequireAuth>
                <Support />
              </RequireAuth>
            }
          />
          <Route
            path="/support/:inquiryId"
            element={
              <RequireAuth>
                <SupportDetail />
              </RequireAuth>
            }
          />
          {/* Inventory route */}
          <Route
            path="/inventory"
            element={
              <RequireAuth>
                <Inventory />
              </RequireAuth>
            }
          />
          {/* Proposal routes */}
          <Route
            path="/proposals"
            element={
              <RequireAuth>
                <Proposals />
              </RequireAuth>
            }
          />
          <Route
            path="/proposals/new"
            element={
              <RequireAuth>
                <ProposalDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/proposals/:id"
            element={
              <RequireAuth>
                <ProposalDetail />
              </RequireAuth>
            }
          />
          {/* Invoice routes */}
          <Route
            path="/invoices"
            element={
              <RequireAuth>
                <Invoices />
              </RequireAuth>
            }
          />
          <Route
            path="/invoices/new"
            element={
              <RequireAuth>
                <InvoiceDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/invoices/:id"
            element={
              <RequireAuth>
                <InvoiceDetail />
              </RequireAuth>
            }
          />
          {/* Clients route */}
          <Route
            path="/clients"
            element={
              <RequireAuth>
                <Clients />
              </RequireAuth>
            }
          />
          {/* Profile route */}
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          {/* Settings route */}
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <SettingsPage />
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
