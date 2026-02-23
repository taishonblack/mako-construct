import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AppLayout } from "./components/AppLayout";
import ContainersPage from "./pages/ContainersPage";
import BinderDetail from "./pages/BinderDetail";

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
            <Route path="/dashboard" element={<ContainersPage />} />
            <Route path="/containers" element={<ContainersPage />} />
            <Route path="/binders" element={<Navigate to="/containers" replace />} />
            <Route path="/binders/:id" element={<BinderDetail />} />
            <Route path="/calendar" element={<ContainersPage />} />
            <Route path="/command" element={<ContainersPage />} />
            <Route path="/documents" element={<ContainersPage />} />
            <Route path="/settings" element={<ContainersPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
