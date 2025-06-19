import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { RequireAuth } from './components/auth/RequireAuth';

// Import pages
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Companies from './pages/Companies';
import UserManagement from './pages/UserManagement';
import Inventory from './pages/Inventory';
import Proposals from './pages/Proposals';
import ProposalDetail from './pages/ProposalDetail';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Clients from './pages/Clients';
import Deleted from './pages/Deleted';
import Support from './pages/Support';
import SupportDetail from './pages/SupportDetail';
import Reviews from './pages/Reviews';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Security from './pages/Security';
import EmailManagement from './pages/EmailManagement';
import YearlyPackages from './pages/YearlyPackages';
import TeamCollaboration from './pages/TeamCollaboration';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="/companies" element={<RequireAuth><Companies /></RequireAuth>} />
              <Route path="/user-management" element={<RequireAuth><UserManagement /></RequireAuth>} />
              <Route path="/inventory" element={<RequireAuth><Inventory /></RequireAuth>} />
              <Route path="/proposals" element={<RequireAuth><Proposals /></RequireAuth>} />
              <Route path="/proposals/:id" element={<RequireAuth><ProposalDetail /></RequireAuth>} />
              <Route path="/proposals/new" element={<RequireAuth><ProposalDetail /></RequireAuth>} />
              <Route path="/invoices" element={<RequireAuth><Invoices /></RequireAuth>} />
              <Route path="/invoices/:id" element={<RequireAuth><InvoiceDetail /></RequireAuth>} />
              <Route path="/clients" element={<RequireAuth><Clients /></RequireAuth>} />
              <Route path="/deleted" element={<RequireAuth><Deleted /></RequireAuth>} />
              <Route path="/support" element={<RequireAuth><Support /></RequireAuth>} />
              <Route path="/support/:id" element={<RequireAuth><SupportDetail /></RequireAuth>} />
              <Route path="/reviews" element={<RequireAuth><Reviews /></RequireAuth>} />
              <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
              <Route path="/security" element={<RequireAuth><Security /></RequireAuth>} />
              <Route path="/email-management" element={<RequireAuth><EmailManagement /></RequireAuth>} />
              <Route path="/yearly-packages" element={<RequireAuth><YearlyPackages /></RequireAuth>} />
              <Route path="/team-collaboration" element={<RequireAuth><TeamCollaboration /></RequireAuth>} />
              
              {/* Route aliases for different status pages */}
              <Route path="/active-orders" element={<Navigate to="/dashboard" replace />} />
              <Route path="/complaints" element={<Navigate to="/dashboard" replace />} />
              <Route path="/completed" element={<Navigate to="/dashboard" replace />} />
              <Route path="/cancelled" element={<Navigate to="/dashboard" replace />} />
              <Route path="/invoice-sent" element={<Navigate to="/invoices" replace />} />
              <Route path="/invoice-paid" element={<Navigate to="/invoices" replace />} />
            </Routes>
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
