import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { RequireAuth } from './components/auth/RequireAuth';
import Companies from './pages/Companies';
import UserManagement from './pages/UserManagement';
import Deleted from './pages/Deleted';
import Reviews from './pages/Reviews';
import Support from "./pages/Support";
import SupportDetail from "./pages/SupportDetail";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
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
      </Router>
    </AuthProvider>
  );
}

export default App;
