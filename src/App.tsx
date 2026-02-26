import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AppLayout } from "./components/AppLayout";
import ContainersPage from "./pages/ContainersPage";
import ContainerDetailPage from "./pages/ContainerDetailPage";
import CalendarPage from "./pages/CalendarPage";
// DashboardPage removed for V1
import WikiPage from "./pages/WikiPage";
import BinderDetail from "./pages/BinderDetail";
import CreateBinderPage from "./pages/CreateBinderPage";
import SettingsPage from "./pages/SettingsPage";
import RoutesPage from "./pages/RoutesPage";
import StaffPage from "./pages/StaffPage";
import ChecklistPage from "./pages/ChecklistPage";
import MorePage from "./pages/MorePage";
import QuinnPage from "./pages/QuinnPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Navigate to="/binders" replace />} />
              <Route path="/binders" element={<ContainersPage />} />
              <Route path="/binders/new" element={<CreateBinderPage />} />
              <Route path="/binders/:id" element={<BinderDetail />} />
              <Route path="/containers" element={<Navigate to="/binders" replace />} />
              <Route path="/containers/:containerId" element={<ContainerDetailPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/checklist" element={<ChecklistPage />} />
              <Route path="/quinn" element={<QuinnPage />} />
              <Route path="/routes" element={<RoutesPage />} />
              <Route path="/staff" element={<StaffPage />} />
              <Route path="/wiki" element={<WikiPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/more" element={<MorePage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
