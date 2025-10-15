import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/dashboard/DashboardHome";
import Reservations from "./pages/dashboard/Reservations";
import FrontDesk from "./pages/dashboard/FrontDesk";
import Housekeeping from "./pages/dashboard/Housekeeping";
import Billing from "./pages/dashboard/Billing";
import Channels from "./pages/dashboard/Channels";
import CRM from "./pages/dashboard/CRM";
import Analytics from "./pages/dashboard/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<DashboardHome />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="front-desk" element={<FrontDesk />} />
            <Route path="housekeeping" element={<Housekeeping />} />
            <Route path="billing" element={<Billing />} />
            <Route path="channels" element={<Channels />} />
            <Route path="crm" element={<CRM />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
