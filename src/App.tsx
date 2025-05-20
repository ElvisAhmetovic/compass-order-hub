
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import AuthGuard from "./components/auth/AuthGuard";
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes - require authentication */}
            <Route path="/dashboard" element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } />
            <Route path="/active-orders" element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } />
            <Route path="/complaints" element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } />
            <Route path="/completed" element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } />
            <Route path="/cancelled" element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } />
            <Route path="/invoice-sent" element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } />
            <Route path="/invoice-paid" element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } />
            <Route path="/companies" element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } />
            
            {/* Admin-only routes */}
            <Route path="/user-management" element={
              <AuthGuard requiredRoles={["admin"]}>
                <UserManagement />
              </AuthGuard>
            } />
            <Route path="/deleted" element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } />
            <Route path="/reviews" element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
