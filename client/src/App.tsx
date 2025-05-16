import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/layout/navbar";
import NotFound from "@/pages/not-found";

// Pages
import Dashboard from "@/pages/dashboard";
import PhotosPage from "@/pages/photos/index";
import PhotoDetailsPage from "@/pages/photos/[id]";
import OrganizationsPage from "@/pages/organizations/index";
import OrganizationDetailsPage from "@/pages/organizations/[id]";
import NewOrganizationPage from "@/pages/organizations/new";
import GalleriesPage from "@/pages/galleries/index";
import GalleryDetailsPage from "@/pages/galleries/[id]";
import CompetitionsPage from "@/pages/competitions/index";
import CompetitionDetailsPage from "@/pages/competitions/[id]";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/photos" component={PhotosPage} />
      <Route path="/photos/:id" component={PhotoDetailsPage} />
      <Route path="/organizations" component={OrganizationsPage} />
      <Route path="/organizations/new" component={NewOrganizationPage} />
      <Route path="/organizations/:id" component={OrganizationDetailsPage} />
      <Route path="/galleries" component={GalleriesPage} />
      <Route path="/galleries/:id" component={GalleryDetailsPage} />
      <Route path="/competitions" component={CompetitionsPage} />
      <Route path="/competitions/:id" component={CompetitionDetailsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Navbar />
          <main className="flex-grow">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <Router />
            </div>
          </main>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
