
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthSessionProvider } from './hooks/useAuthSession';  
import { SupabaseAuthProvider } from './context/SupabaseAuthContext';
import { Toaster } from "@/components/ui/toaster";
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
import Auth from './pages/Auth';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  // Log when the App component mounts to help with debugging
  useEffect(() => {
    console.log("App component mounted");
    // Log initial auth state
    supabase.auth.getSession().then(({ data }) => {
      console.log("Initial auth session:", data.session ? "Authenticated" : "Not authenticated");
    });
  }, []);

  return (
    <Router>
      <AuthSessionProvider>
        <SupabaseAuthProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
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
                    <AuthGuard requiredRoles={["admin", "owner"]}>
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
            <Toaster />
          </AuthProvider>
        </SupabaseAuthProvider>
      </AuthSessionProvider>
    </Router>
  );
}

// Import statement for supabase
import { supabase } from './integrations/supabase/client';

export default App;
