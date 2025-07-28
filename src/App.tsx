
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { UserSettingsProvider } from "@/hooks/useUserSettings";
import ProtectedRoute from "@/components/ProtectedRoute";
import EnhancedProtectedRoute from "@/components/EnhancedProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import UserProfile from "./pages/UserProfile";
import AccountSettings from "./pages/AccountSettings";
import SecuritySettings from "./pages/SecuritySettings";
import NotificationSettings from "./pages/NotificationSettings";
import HelpSupport from "./pages/HelpSupport";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CancellationPolicy from "./pages/CancellationPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import Blog from "./pages/Blog";
import Checkout from "./pages/Checkout";
import ResetPassword from "./pages/ResetPassword";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import ServerError from "./pages/ServerError";
import CookieBanner from "./components/CookieBanner";
import AdminLayout from "./components/AdminLayout";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UserSettingsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancel" element={<PaymentCancel />} />
            <Route path="/server-error" element={<ServerError />} />
            <Route path="/dashboard" element={
              <EnhancedProtectedRoute>
                <Dashboard />
              </EnhancedProtectedRoute>
            } />
            <Route path="/user-profile" element={
              <EnhancedProtectedRoute>
                <UserProfile />
              </EnhancedProtectedRoute>
            } />
            <Route path="/account-settings" element={
              <EnhancedProtectedRoute>
                <AccountSettings />
              </EnhancedProtectedRoute>
            } />
            <Route path="/security-settings" element={
              <EnhancedProtectedRoute>
                <SecuritySettings />
              </EnhancedProtectedRoute>
            } />
            <Route path="/notification-settings" element={
              <EnhancedProtectedRoute>
                <NotificationSettings />
              </EnhancedProtectedRoute>
            } />
            <Route path="/help-support" element={
              <EnhancedProtectedRoute>
                <HelpSupport />
              </EnhancedProtectedRoute>
            } />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/cancellation" element={<CancellationPolicy />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/admin/*" element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieBanner />
        </BrowserRouter>
      </TooltipProvider>
      </UserSettingsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
