import { useLocation } from "wouter";
import { OrganizationForm } from "@/components/organizations/organization-form";
import { useAuth } from "@/hooks/useAuth";
import { Organization } from "@shared/schema";
import { useEffect } from "react";

export default function NewOrganizationPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading]);
  
  const handleSuccess = (organization: Organization) => {
    setLocation(`/organizations/${organization.id}`);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Organization</h1>
      <OrganizationForm onSuccess={handleSuccess} />
    </div>
  );
}
