import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Hackathons from "@/pages/Hackathons";
import CreateHackathon from "@/pages/CreateHackathon";
import Evaluations from "@/pages/Evaluations";
import EvaluationResults from "@/pages/EvaluationResults";
import SubmissionDetail from "@/pages/SubmissionDetail";
import Layout from "@/components/layout/Layout";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/hackathons" component={Hackathons} />
        <Route path="/hackathons/create" component={CreateHackathon} />
        <Route path="/evaluations" component={Evaluations} />
        <Route path="/evaluations/:id" component={EvaluationResults} />
        <Route path="/submissions/:id" component={SubmissionDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
