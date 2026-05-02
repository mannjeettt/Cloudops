import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import AppLayout from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./hooks/auth-provider";
import { queryClient } from "./lib/query-client";
import { QueryClientProvider } from "@tanstack/react-query";

const Alerts = lazy(() => import("./pages/Alerts"));
const CICD = lazy(() => import("./pages/CICD"));
const Cloud = lazy(() => import("./pages/Cloud"));
const Containers = lazy(() => import("./pages/Containers"));
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Monitoring = lazy(() => import("./pages/Monitoring"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Settings = lazy(() => import("./pages/Settings"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={null}>
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
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
