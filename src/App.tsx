import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AppLayout } from "./components/AppLayout";
import ContainersPage from "./pages/ContainersPage";
import ContainerDetailPage from "./pages/ContainerDetailPage";
import CalendarPage from "./pages/CalendarPage";
import DashboardPage from "./pages/DashboardPage";
import WikiPage from "./pages/WikiPage";
import BinderDetail from "./pages/BinderDetail";
import CreateBinderPage from "./pages/CreateBinderPage";
import SettingsPage from "./pages/SettingsPage";
import RoutesPage from "./pages/RoutesPage";
import StaffPage from "./pages/StaffPage";
import ChecklistPage from "./pages/ChecklistPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/binders" element={<ContainersPage />} />
            <Route path="/binders/new" element={<CreateBinderPage />} />
            <Route path="/binders/:id" element={<BinderDetail />} />
            <Route path="/containers" element={<Navigate to="/binders" replace />} />
            <Route path="/containers/:containerId" element={<ContainerDetailPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/checklist" element={<ChecklistPage />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/wiki" element={<WikiPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
