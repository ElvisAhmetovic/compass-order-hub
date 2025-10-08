
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Companies from "./pages/Companies";
import Inventory from "./pages/Inventory";
import UserManagement from "./pages/UserManagement";
import Invoices from "./pages/Invoices";
import InvoiceDetail from "./pages/InvoiceDetail";
import Clients from "./pages/Clients";
import Proposals from "./pages/Proposals";
import ProposalDetail from "./pages/ProposalDetail";
import Support from "./pages/Support";
import SupportDetail from "./pages/SupportDetail";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Security from "./pages/Security";
import EmailManagement from "./pages/EmailManagement";
import TeamCollaboration from "./pages/TeamCollaboration";
import Deleted from "./pages/Deleted";
import Reviews from "./pages/Reviews";
import YearlyPackages from "./pages/YearlyPackages";
import Facebook from "./pages/Facebook";
import Instagram from "./pages/Instagram";
import Trustpilot from "./pages/Trustpilot";
import TrustpilotDeletion from "./pages/TrustpilotDeletion";
import GoogleDeletion from "./pages/GoogleDeletion";
import TechSupport from "./pages/TechSupport";
import TechSupportDetail from "./pages/TechSupportDetail";
import NotFound from "./pages/NotFound";
import { RequireAuth } from "./components/auth/RequireAuth";
import AdminGuard from "./components/auth/AdminGuard";
import TemporaryNotificationBanner from "./components/notifications/TemporaryNotificationBanner";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <Router>
              <TemporaryNotificationBanner />
              <div className="min-h-screen bg-background">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/dashboard" element={
                    <RequireAuth>
                      <Dashboard />
                    </RequireAuth>
                  } />
                  <Route path="/active-orders" element={
                    <RequireAuth>
                      <Dashboard />
                    </RequireAuth>
                  } />
                  <Route path="/yearly-packages" element={
                    <RequireAuth>
                      <YearlyPackages />
                    </RequireAuth>
                  } />
                  <Route path="/facebook" element={
                    <RequireAuth>
                      <Facebook />
                    </RequireAuth>
                  } />
                  <Route path="/instagram" element={
                    <RequireAuth>
                      <Instagram />
                    </RequireAuth>
                  } />
                  <Route path="/trustpilot" element={
                    <RequireAuth>
                      <Trustpilot />
                    </RequireAuth>
                  } />
                  <Route path="/trustpilot-deletion" element={
                    <RequireAuth>
                      <TrustpilotDeletion />
                    </RequireAuth>
                  } />
                  <Route path="/google-deletion" element={
                    <RequireAuth>
                      <GoogleDeletion />
                    </RequireAuth>
                  } />
                  <Route path="/complaints" element={
                    <RequireAuth>
                      <Dashboard />
                    </RequireAuth>
                  } />
                  <Route path="/completed" element={
                    <RequireAuth>
                      <Dashboard />
                    </RequireAuth>
                  } />
                  <Route path="/cancelled" element={
                    <RequireAuth>
                      <Dashboard />
                    </RequireAuth>
                  } />
                  <Route path="/invoice-sent" element={
                    <RequireAuth>
                      <Dashboard />
                    </RequireAuth>
                  } />
                  <Route path="/invoice-paid" element={
                    <RequireAuth>
                      <Dashboard />
                    </RequireAuth>
                  } />
                  <Route path="/reviews" element={
                    <RequireAuth>
                      <Reviews />
                    </RequireAuth>
                  } />
                  <Route path="/analytics" element={
                    <RequireAuth>
                      <Analytics />
                    </RequireAuth>
                  } />
                  <Route path="/companies" element={
                    <RequireAuth>
                      <Companies />
                    </RequireAuth>
                  } />
                  <Route path="/inventory" element={
                    <RequireAuth>
                      <Inventory />
                    </RequireAuth>
                  } />
                  <Route path="/user-management" element={
                    <RequireAuth>
                      <AdminGuard>
                        <UserManagement />
                      </AdminGuard>
                    </RequireAuth>
                  } />
                  <Route path="/invoices" element={
                    <RequireAuth>
                      <Invoices />
                    </RequireAuth>
                  } />
                  <Route path="/invoices/:id" element={
                    <RequireAuth>
                      <InvoiceDetail />
                    </RequireAuth>
                  } />
                  <Route path="/clients" element={
                    <RequireAuth>
                      <Clients />
                    </RequireAuth>
                  } />
                  <Route path="/proposals" element={
                    <RequireAuth>
                      <Proposals />
                    </RequireAuth>
                  } />
                  <Route path="/proposals/:id" element={
                    <RequireAuth>
                      <ProposalDetail />
                    </RequireAuth>
                  } />
                  <Route path="/support" element={
                    <RequireAuth>
                      <Support />
                    </RequireAuth>
                  } />
                  <Route path="/support/:id" element={
                    <RequireAuth>
                      <SupportDetail />
                    </RequireAuth>
                  } />
                  <Route path="/tech-support" element={
                    <RequireAuth>
                      <TechSupport />
                    </RequireAuth>
                  } />
                  <Route path="/tech-support/:ticketId" element={
                    <RequireAuth>
                      <TechSupportDetail />
                    </RequireAuth>
                  } />
                  <Route path="/settings" element={
                    <RequireAuth>
                      <Settings />
                    </RequireAuth>
                  } />
                  <Route path="/profile" element={
                    <RequireAuth>
                      <Profile />
                    </RequireAuth>
                  } />
                  <Route path="/security" element={
                    <RequireAuth>
                      <Security />
                    </RequireAuth>
                  } />
                  <Route path="/email-management" element={
                    <RequireAuth>
                      <EmailManagement />
                    </RequireAuth>
                  } />
                  <Route path="/team-collaboration" element={
                    <RequireAuth>
                      <TeamCollaboration />
                    </RequireAuth>
                  } />
                  <Route path="/deleted" element={
                    <RequireAuth>
                      <AdminGuard>
                        <Deleted />
                      </AdminGuard>
                    </RequireAuth>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <Toaster />
              <Sonner />
            </Router>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
