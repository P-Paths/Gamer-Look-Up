import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import PSNTest from "@/pages/psn-test";
import PSNDashboardPage from "@/pages/psn-dashboard";
import PSNMultiTestPage from "@/pages/psn-multi-test";
import RealGamingTestPage from "@/pages/real-gaming-test";
import InternalPage from "@/pages/internal";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/psn-test" component={PSNTest} />
      <Route path="/psn-dashboard" component={PSNDashboardPage} />
      <Route path="/psn-multi-test" component={PSNMultiTestPage} />
      <Route path="/real-gaming-test" component={RealGamingTestPage} />
      <Route path="/internal" component={InternalPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
