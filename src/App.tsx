import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import AppLayout from "./components/AppLayout";
import Alerts from "./pages/Alerts";
import CICD from "./pages/CICD";
import Cloud from "./pages/Cloud";
import Containers from "./pages/Containers";
import Index from "./pages/Index";
import Monitoring from "./pages/Monitoring";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/cicd" element={<CICD />} />
            <Route path="/containers" element={<Containers />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/cloud" element={<Cloud />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
