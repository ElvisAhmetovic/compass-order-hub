
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Companies from "@/pages/Companies";
import Clients from "@/pages/Clients";
import Profile from "@/pages/Profile";
import Invoices from "@/pages/Invoices";
import InvoiceDetail from "@/pages/InvoiceDetail";
import Proposals from "@/pages/Proposals";
import ProposalDetail from "@/pages/ProposalDetail";
import Inventory from "@/pages/Inventory";
import Analytics from "@/pages/Analytics";
import Reviews from "@/pages/Reviews";
import Deleted from "@/pages/Deleted";
import UserManagement from "@/pages/UserManagement";
import Support from "@/pages/Support";
import SupportDetail from "@/pages/SupportDetail";
import SettingsPage from "@/pages/Settings";
import Security from "@/pages/Security";
import TeamCollaboration from "@/pages/TeamCollaboration";
import YearlyPackages from "@/pages/YearlyPackages";
import EmailManagement from "@/pages/EmailManagement";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/active-orders" element={<Dashboard />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/:id" element={<InvoiceDetail />} />
              <Route path="/proposals" element={<Proposals />} />
              <Route path="/proposals/:id" element={<ProposalDetail />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/deleted" element={<Deleted />} />
              <Route path="/user-management" element={<UserManagement />} />
              <Route path="/support" element={<Support />} />
              <Route path="/support/:id" element={<SupportDetail />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/security" element={<Security />} />
              <Route path="/team-collaboration" element={<TeamCollaboration />} />
              <Route path="/yearly-packages" element={<YearlyPackages />} />
              <Route path="/email-management" element={<EmailManagement />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
