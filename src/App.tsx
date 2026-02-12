import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DashboardSkeleton } from "@/components/ui/skeletons/DashboardSkeleton";

// Eager load critical routes
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

// Lazy load dashboard pages for code splitting
const DashboardHome = lazy(() => import("./pages/dashboard/DashboardHome"));
const DashboardAlternative = lazy(() => import("./pages/DashboardAlternative"));
const Reservations = lazy(() => import("./pages/dashboard/Reservations"));
const FrontDesk = lazy(() => import("./pages/dashboard/FrontDesk"));
const Housekeeping = lazy(() => import("./pages/dashboard/Housekeeping"));
const Billing = lazy(() => import("./pages/dashboard/Billing"));
const Channels = lazy(() => import("./pages/dashboard/Channels"));
const CRM = lazy(() => import("./pages/dashboard/CRM"));
const Inventory = lazy(() => import("./pages/dashboard/Inventory"));
const Tasks = lazy(() => import("./pages/dashboard/Tasks"));
const Staff = lazy(() => import("./pages/dashboard/Staff"));
const Analytics = lazy(() => import("./pages/dashboard/Analytics"));
const Revenue = lazy(() => import("./pages/dashboard/Revenue"));
const Reports = lazy(() => import("./pages/dashboard/Reports"));
const Security = lazy(() => import("./pages/dashboard/Security"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const Profile = lazy(() => import("./pages/dashboard/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => {
  console.log('🎨 App component rendering...');

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<DashboardSkeleton />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />}>
                  <Route index element={<DashboardAlternative />} />
                  <Route path="classic" element={<DashboardHome />} />
                  <Route path="reservations" element={<Reservations />} />
                  <Route path="front-desk" element={<FrontDesk />} />
                  <Route path="housekeeping" element={<Housekeeping />} />
                  <Route path="billing" element={<Billing />} />
                  <Route path="channels" element={<Channels />} />
                  <Route path="revenue" element={<Revenue />} />
                  <Route path="crm" element={<CRM />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="tasks" element={<Tasks />} />
                  <Route path="staff" element={<Staff />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="security" element={<Security />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
