import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AppLayout } from "./components/AppLayout";
import ContainersPage from "./pages/ContainersPage";
import CalendarPage from "./pages/CalendarPage";
import DashboardPage from "./pages/DashboardPage";
import CommandPage from "./pages/CommandPage";
import WikiPage from "./pages/WikiPage";
import BinderDetail from "./pages/BinderDetail";
import SettingsPage from "./pages/SettingsPage";

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
            <Route path="/containers" element={<ContainersPage />} />
            <Route path="/binders" element={<Navigate to="/containers" replace />} />
            <Route path="/binders/:id" element={<BinderDetail />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/command" element={<CommandPage />} />
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
