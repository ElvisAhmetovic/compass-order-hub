
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { RequireAuth } from './components/auth/RequireAuth';
import Companies from './pages/Companies';
import UserManagement from './pages/UserManagement';
import Deleted from './pages/Deleted';
import Reviews from './pages/Reviews';
import Support from "./pages/Support";
import SupportDetail from "./pages/SupportDetail";
import Index from './pages/Index';
import AuthGuard from './components/auth/AuthGuard';

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
                <AuthGuard requiredRoles={["admin"]}>
                  <Companies />
                </AuthGuard>
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
                <Deleted />
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
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
