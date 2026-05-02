import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { bootstrapLiveData } from "@/data/bootstrap";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index.tsx";
import Pqi from "./pages/Pqi.tsx";
import Tqi from "./pages/Tqi.tsx";
import Config from "./pages/Config.tsx";
import Qbom from "./pages/Qbom.tsx";
import Historian from "./pages/Historian.tsx";
import Settings from "./pages/Settings.tsx";
import Users from "./pages/Users.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const cleanup = bootstrapLiveData();
    return cleanup;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/pqi" element={<Pqi />} />
              <Route path="/tqi" element={<Tqi />} />
              <Route path="/config" element={<Config />} />
              <Route path="/qbom" element={<Qbom />} />
              <Route path="/historian" element={<Historian />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/users" element={<Users />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
