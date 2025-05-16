import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { OrganizationWithStats } from "@/lib/types";
import { OrganizationCard } from "@/components/organizations/organization-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function OrganizationsPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch all organizations
  const { data: organizations, isLoading } = useQuery<OrganizationWithStats[]>({
    queryKey: ["/api/organizations"],
    queryFn: async () => {
      const res = await fetch("/api/organizations");
      if (!res.ok) throw new Error("Failed to fetch organizations");
      return res.json();
    },
  });
  
  // Fetch user's organizations
  const { data: userOrganizations } = useQuery<OrganizationWithStats[]>({
    queryKey: [`/api/organizations/user/${user?.id}`],
    enabled: !!user?.id,
  });
  
  // Filter and search organizations
  const filteredOrganizations = organizations?.filter(org => {
    if (!searchTerm) return true;
    return (
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.description && org.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });
  
  // Determine which organizations the user is a member of
  const enhancedOrganizations = filteredOrganizations?.map(org => {
    const userOrg = userOrganizations?.find(userOrg => userOrg.id === org.id);
    return {
      ...org,
      isCurrentUserMember: !!userOrg,
      isAdmin: userOrg?.isAdmin || false
    };
  });
  
  const myOrganizations = enhancedOrganizations?.filter(org => org.isCurrentUserMember);
  const otherOrganizations = enhancedOrganizations?.filter(org => !org.isCurrentUserMember);
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-600">Connect with other photographers and participate in competitions</p>
        </div>
        
        {isAuthenticated && (
          <Button asChild>
            <Link href="/organizations/new">
              <a>Create Organization</a>
            </Link>
          </Button>
        )}
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search organizations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {isAuthenticated && myOrganizations && myOrganizations.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">My Organizations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myOrganizations.map(org => (
                  <OrganizationCard key={org.id} organization={org} />
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              {isAuthenticated && myOrganizations && myOrganizations.length > 0 
                ? "Other Organizations"
                : "All Organizations"
              }
            </h2>
            
            {otherOrganizations && otherOrganizations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherOrganizations.map(org => (
                  <OrganizationCard key={org.id} organization={org} />
                ))}
                
                {isAuthenticated && (
                  <Card className="border-2 border-dashed border-gray-300 flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <Users className="h-5 w-5 text-gray-400" />
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">Create Organization</h3>
                      <p className="text-sm text-gray-500 mb-4">Start a new photography community</p>
                      <Button asChild>
                        <Link href="/organizations/new">
                          <a>Create Now</a>
                        </Link>
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                {searchTerm ? (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No results found</h3>
                    <p className="text-gray-600">
                      No organizations matching "{searchTerm}" were found
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No organizations yet</h3>
                    <p className="text-gray-600 mb-4">
                      Be the first to create a photography organization
                    </p>
                    {isAuthenticated && (
                      <Button asChild>
                        <Link href="/organizations/new">
                          <a>Create Organization</a>
                        </Link>
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
