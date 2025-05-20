
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "@/components/auth/RequireAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/active-orders" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/complaints" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/completed" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/cancelled" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/invoice-sent" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/invoice-paid" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/companies" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/user-management" element={<RequireAuth><UserManagement /></RequireAuth>} />
          <Route path="/deleted" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/reviews" element={<RequireAuth><Dashboard /></RequireAuth>} />
          
          {/* Catch-all and not found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
