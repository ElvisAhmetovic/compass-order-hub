// App entry
import { useEffect, lazy as reactLazy, Suspense, ComponentType } from "react";

// If a page file is missing (stale tab after a publish), reload once to get the latest version.
const lazy = <T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) =>
  reactLazy(() =>
    factory().catch((err) => {
      const key = "chunk-reload-at";
      const last = Number(sessionStorage.getItem(key) || 0);
      if (Date.now() - last > 10000) {
        sessionStorage.setItem(key, String(Date.now()));
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    })
  );
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { ClientLanguageProvider } from "./context/ClientLanguageContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
const ServicePage = lazy(() => import("./pages/ServicePage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Rankings = lazy(() => import("./pages/Rankings"));
const UserStatistics = lazy(() => import("./pages/UserStatistics"));
const Companies = lazy(() => import("./pages/Companies"));
const Inventory = lazy(() => import("./pages/Inventory"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const Invoices = lazy(() => import("./pages/Invoices"));
const InvoiceDetail = lazy(() => import("./pages/InvoiceDetail"));
const Clients = lazy(() => import("./pages/Clients"));
const Proposals = lazy(() => import("./pages/Proposals"));
const ProposalDetail = lazy(() => import("./pages/ProposalDetail"));
const Support = lazy(() => import("./pages/Support"));
const SupportDetail = lazy(() => import("./pages/SupportDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const Security = lazy(() => import("./pages/Security"));
const EmailManagement = lazy(() => import("./pages/EmailManagement"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const TeamCollaboration = lazy(() => import("./pages/TeamCollaboration"));
const Deleted = lazy(() => import("./pages/Deleted"));
const Reviews = lazy(() => import("./pages/Reviews"));
const YearlyPackages = lazy(() => import("./pages/YearlyPackages"));
const Facebook = lazy(() => import("./pages/Facebook"));
const Instagram = lazy(() => import("./pages/Instagram"));
const Trustpilot = lazy(() => import("./pages/Trustpilot"));
const TrustpilotDeletion = lazy(() => import("./pages/TrustpilotDeletion"));
const GoogleDeletion = lazy(() => import("./pages/GoogleDeletion"));
const TechSupport = lazy(() => import("./pages/TechSupport"));
const TechSupportDetail = lazy(() => import("./pages/TechSupportDetail"));
const CustomerTickets = lazy(() => import("./pages/CustomerTickets"));
const CustomerTicketDetail = lazy(() => import("./pages/CustomerTicketDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Reminders = lazy(() => import("./pages/Reminders"));
const WorkHours = lazy(() => import("./pages/WorkHours"));
const WorkHoursV2 = lazy(() => import("./pages/WorkHoursV2"));
const WorkHoursAdmin = lazy(() => import("./pages/WorkHoursAdmin"));
const InvoiceAuditLogPage = lazy(() => import("./pages/admin/InvoiceAuditLogPage"));
const MonthlyPackages = lazy(() => import("./pages/MonthlyPackages"));
const MonthlyInvoiceStatus = lazy(() => import("./pages/MonthlyInvoiceStatus"));
const Offers = lazy(() => import("./pages/Offers"));
const TicketSubmitted = lazy(() => import("./pages/TicketSubmitted"));
const TicketLoading = lazy(() => import("./pages/TicketLoading"));
const ConfirmOffer = lazy(() => import("./pages/ConfirmOffer"));
const SocialFacebook = lazy(() => import("./pages/social/Facebook"));
const SocialAbmWebsite = lazy(() => import("./pages/social/AbmWebsite"));
const SocialInstagram = lazy(() => import("./pages/social/Instagram"));
const SocialTikTok = lazy(() => import("./pages/social/TikTok"));
const SocialTwitter = lazy(() => import("./pages/social/Twitter"));
const SocialWeeklyReport = lazy(() => import("./pages/social/WeeklyReportPage"));
import { RequireAuth } from "./components/auth/RequireAuth";
import AdminGuard from "./components/auth/AdminGuard";
import ClientGuard from "./components/client-portal/ClientGuard";
import NavigationProgress from "./components/layout/NavigationProgress";

// Client Portal Pages
const ClientDashboard = lazy(() => import("./pages/client/ClientDashboard"));
const ClientOrders = lazy(() => import("./pages/client/ClientOrders"));
const ClientOrderDetail = lazy(() => import("./pages/client/ClientOrderDetail"));
const ClientInvoices = lazy(() => import("./pages/client/ClientInvoices"));
const ClientSupport = lazy(() => import("./pages/client/ClientSupport"));
const ClientSupportDetail = lazy(() => import("./pages/client/ClientSupportDetail"));
const ClientSettings = lazy(() => import("./pages/client/ClientSettings"));
const ClientLogin = lazy(() => import("./pages/client/ClientLogin"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  useEffect(() => {
    const resetPointerEvents = () => {
      document.documentElement.style.pointerEvents = 'none';
      setTimeout(() => {
        document.documentElement.style.pointerEvents = '';
      }, 100);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetPointerEvents();
      }
    };

    const handleWindowFocus = () => {
      resetPointerEvents();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider skipDelayDuration={0} delayDuration={300}>
          <AuthProvider>
            <Router>
              <NavigationProgress />
              <div className="min-h-screen bg-background">
                <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/webdesign" element={<ServicePage serviceKey="webdesign" />} />
                  <Route path="/google-seo" element={<ServicePage serviceKey="googleSeo" />} />
                  <Route path="/digital-marketing" element={<ServicePage serviceKey="digitalMarketing" />} />
                  <Route path="/app-entwicklung" element={<ServicePage serviceKey="appDevelopment" />} />
                  <Route path="/kontakt" element={<ContactPage />} />
                  <Route path="/ueber-uns" element={<AboutPage />} />
                  <Route path="/impressum" element={<LegalPage pageKey="impressum" />} />
                  <Route path="/datenschutz" element={<LegalPage pageKey="datenschutz" />} />
                  <Route path="/terms" element={<LegalPage pageKey="terms" />} />
                  <Route path="/ticket-loading" element={<TicketLoading />} />
                  <Route path="/ticket-submitted" element={<TicketSubmitted />} />
                  <Route path="/confirm-offer/:offerId" element={<ConfirmOffer />} />
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
                  <Route path="/rankings" element={
                    <RequireAuth>
                      <Rankings />
                    </RequireAuth>
                  } />
                  <Route path="/user-statistics" element={
                    <RequireAuth>
                      <UserStatistics />
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
                  <Route path="/customer-tickets" element={
                    <RequireAuth>
                      <CustomerTickets />
                    </RequireAuth>
                  } />
                  <Route path="/customer-tickets/:id" element={
                    <RequireAuth>
                      <CustomerTicketDetail />
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
                  <Route path="/settings/notifications" element={
                    <RequireAuth>
                      <AdminGuard>
                        <NotificationSettings />
                      </AdminGuard>
                    </RequireAuth>
                  } />
                  <Route path="/work-hours" element={
                    <RequireAuth>
                      <WorkHours />
                    </RequireAuth>
                  } />
                  <Route path="/work-hours-v2" element={
                    <RequireAuth>
                      <WorkHoursV2 />
                    </RequireAuth>
                  } />
                  <Route path="/admin/work-hours" element={
                    <RequireAuth>
                      <AdminGuard>
                        <WorkHoursAdmin />
                      </AdminGuard>
                    </RequireAuth>
                  } />
                  <Route path="/admin/invoice-audit" element={
                    <RequireAuth>
                      <AdminGuard>
                        <InvoiceAuditLogPage />
                      </AdminGuard>
                    </RequireAuth>
                  } />
                  <Route path="/monthly-packages" element={
                    <RequireAuth>
                      <MonthlyPackages />
                    </RequireAuth>
                  } />
                  <Route path="/monthly-invoice-status" element={
                    <RequireAuth>
                      <MonthlyInvoiceStatus />
                    </RequireAuth>
                  } />
                  <Route path="/reminders" element={
                    <RequireAuth>
                      <Reminders />
                    </RequireAuth>
                  } />
                  <Route path="/offers" element={
                    <RequireAuth>
                      <Offers />
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
                  <Route path="/social/facebook" element={<RequireAuth><SocialFacebook /></RequireAuth>} />
                  <Route path="/social/abm-website" element={<RequireAuth><SocialAbmWebsite /></RequireAuth>} />
                  <Route path="/social/instagram" element={<RequireAuth><SocialInstagram /></RequireAuth>} />
                  <Route path="/social/tiktok" element={<RequireAuth><SocialTikTok /></RequireAuth>} />
                  <Route path="/social/twitter" element={<RequireAuth><SocialTwitter /></RequireAuth>} />
                  <Route path="/social/:platform/report" element={<RequireAuth><SocialWeeklyReport /></RequireAuth>} />
                  
                  {/* Client Portal Routes */}
                  <Route path="/client/login" element={<ClientLogin />} />
                  <Route path="/client/dashboard" element={
                    <ClientGuard>
                      <ClientLanguageProvider>
                        <ClientDashboard />
                      </ClientLanguageProvider>
                    </ClientGuard>
                  } />
                  <Route path="/client/orders" element={
                    <ClientGuard>
                      <ClientLanguageProvider>
                        <ClientOrders />
                      </ClientLanguageProvider>
                    </ClientGuard>
                  } />
                  <Route path="/client/orders/:id" element={
                    <ClientGuard>
                      <ClientLanguageProvider>
                        <ClientOrderDetail />
                      </ClientLanguageProvider>
                    </ClientGuard>
                  } />
                  <Route path="/client/invoices" element={
                    <ClientGuard>
                      <ClientLanguageProvider>
                        <ClientInvoices />
                      </ClientLanguageProvider>
                    </ClientGuard>
                  } />
                  <Route path="/client/support" element={
                    <ClientGuard>
                      <ClientLanguageProvider>
                        <ClientSupport />
                      </ClientLanguageProvider>
                    </ClientGuard>
                  } />
                  <Route path="/client/support/:ticketId" element={
                    <ClientGuard>
                      <ClientLanguageProvider>
                        <ClientSupportDetail />
                      </ClientLanguageProvider>
                    </ClientGuard>
                  } />
                  <Route path="/client/settings" element={
                    <ClientGuard>
                      <ClientLanguageProvider>
                        <ClientSettings />
                      </ClientLanguageProvider>
                    </ClientGuard>
                  } />
                  <Route path="/client" element={<ClientLogin />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
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
