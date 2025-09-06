import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Members from "@/pages/members";
import Attendance from "@/pages/attendance";
import Payments from "@/pages/payments";
import QRRegistration from "@/pages/qr-registration";
import Communication from "@/pages/communication";
import Reports from "@/pages/reports";
import MemberRegistrationForm from "@/components/member-registration-form";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/members" component={Members} />
      <ProtectedRoute path="/attendance" component={Attendance} />
      <ProtectedRoute path="/payments" component={Payments} />
      <ProtectedRoute path="/qr-registration" component={QRRegistration} />
      <ProtectedRoute path="/communication" component={Communication} />
      <ProtectedRoute path="/reports" component={Reports} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/register" component={MemberRegistrationForm} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
