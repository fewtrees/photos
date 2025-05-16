import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Competition, Organization } from "@shared/schema";
import { CompetitionCard } from "@/components/competitions/competition-card";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { CompetitionWithStats } from "@/lib/types";
import { Search, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function CompetitionsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Fetch all competitions
  const { data: competitions, isLoading } = useQuery<(Competition & { organization: Organization })[]>({
    queryKey: ["/api/competitions"],
    queryFn: async () => {
      const res = await fetch("/api/competitions");
      if (!res.ok) throw new Error("Failed to fetch competitions");
      return res.json();
    },
  });
  
  // Fetch user's organizations if logged in
  const { data: userOrganizations } = useQuery({
    queryKey: [`/api/organizations/user/${user?.id}`],
    enabled: !!user?.id,
  });
  
  // Filter competitions based on search and status
  const filteredCompetitions = competitions?.filter(competition => {
    // Check status filter
    if (statusFilter === "active" && !competition.isActive) return false;
    if (statusFilter === "completed" && competition.isActive) return false;
    
    // Check search term
    if (!searchTerm) return true;
    return (
      competition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      competition.organization.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (competition.description && competition.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });
  
  // Enhance competitions with additional info
  const enhancedCompetitions: CompetitionWithStats[] = filteredCompetitions?.map(competition => {
    // Check if user is admin of the organization
    const isOrgAdmin = userOrganizations?.some(
      org => org.id === competition.organizationId && org.isAdmin
    );
    
    return {
      ...competition,
      isUserAdmin: !!isOrgAdmin
    };
  }) || [];
  
  // Separate user's admin competitions
  const adminCompetitions = enhancedCompetitions.filter(comp => comp.isUserAdmin);
  const otherCompetitions = enhancedCompetitions.filter(comp => !comp.isUserAdmin);
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Competitions</h1>
        <p className="text-gray-600">Participate in photography competitions and showcase your best work</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-3/4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search competitions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="w-full md:w-1/4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Competitions</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="completed">Completed Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {user && adminCompetitions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Trophy className="mr-2 h-5 w-5 text-purple-500" /> 
                Competitions You Manage
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminCompetitions.map(competition => (
                  <CompetitionCard 
                    key={competition.id} 
                    competition={competition} 
                    isAdminView={true}
                  />
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              {user && adminCompetitions.length > 0 ? "All Competitions" : "Available Competitions"}
            </h2>
            
            {otherCompetitions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherCompetitions.map(competition => (
                  <CompetitionCard 
                    key={competition.id} 
                    competition={competition}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                {searchTerm || statusFilter !== "all" ? (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No competitions found</h3>
                    <p className="text-gray-600">
                      Try adjusting your search or filters
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No competitions available</h3>
                    <p className="text-gray-600">
                      Check back later for new competitions
                    </p>
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
