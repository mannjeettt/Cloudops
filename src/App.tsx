import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import AppLayout from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./hooks/use-auth";
import { queryClient } from "./lib/query-client";
import Alerts from "./pages/Alerts";
import CICD from "./pages/CICD";
import Cloud from "./pages/Cloud";
import Containers from "./pages/Containers";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Monitoring from "./pages/Monitoring";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import { QueryClientProvider } from "@tanstack/react-query";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/monitoring" element={<Monitoring />} />
                <Route path="/cicd" element={<CICD />} />
                <Route path="/containers" element={<Containers />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/cloud" element={<Cloud />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
