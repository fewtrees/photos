import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Organization, Competition, User, UserOrganization } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CompetitionCard } from "@/components/competitions/competition-card";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { CompetitionForm } from "@/components/competitions/competition-form";
import { useState } from "react";
import { OrganizationForm } from "@/components/organizations/organization-form";
import { Calendar, Users, Trophy, Info } from "lucide-react";
import { format } from "date-fns";

export default function OrganizationDetailsPage() {
  const [match, params] = useRoute<{ id: string }>("/organizations/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showNewCompetitionDialog, setShowNewCompetitionDialog] = useState(false);
  const [showEditOrgDialog, setShowEditOrgDialog] = useState(false);
  
  const { data: organization, isLoading: isOrgLoading } = useQuery<Organization>({
    queryKey: [`/api/organizations/${params?.id}`],
    enabled: !!params?.id,
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${params?.id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Organization not found");
        throw new Error("Failed to fetch organization details");
      }
      return res.json();
    },
  });
  
  const { data: competitions, isLoading: isCompetitionsLoading } = useQuery<Competition[]>({
    queryKey: [`/api/organizations/${params?.id}/competitions`],
    enabled: !!params?.id,
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${params?.id}/competitions`);
      if (!res.ok) throw new Error("Failed to fetch competitions");
      return res.json();
    },
  });
  
  const { data: members, isLoading: isMembersLoading } = useQuery<(UserOrganization & { user: User })[]>({
    queryKey: [`/api/organizations/${params?.id}/users`],
    enabled: !!params?.id,
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${params?.id}/users`);
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
  });
  
  const { data: userOrg } = useQuery<UserOrganization>({
    queryKey: [`/api/organizations/${params?.id}/users/${user?.id}`],
    enabled: !!params?.id && !!user?.id,
    queryFn: async () => {
      try {
        const res = await fetch(`/api/organizations/${params?.id}/users/${user?.id}`);
        if (!res.ok) return null;
        return res.json();
      } catch (error) {
        return null; // User is not a member
      }
    },
  });
  
  const isAdmin = userOrg?.isAdmin;
  const isMember = !!userOrg;
  
  const { mutate: joinOrganization, isPending: isJoining } = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/organizations/${params?.id}/users`, {
        userId: user?.id,
        isAdmin: false,
      });
    },
    onSuccess: () => {
      toast({
        title: "Joined organization",
        description: "You are now a member of this organization.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${params?.id}/users`] });
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${params?.id}/users/${user?.id}`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to join organization",
        description: error.message || "An error occurred while trying to join.",
        variant: "destructive",
      });
    },
  });
  
  const { mutate: leaveOrganization, isPending: isLeaving } = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/organizations/${params?.id}/users/${user?.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Left organization",
        description: "You are no longer a member of this organization.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${params?.id}/users`] });
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${params?.id}/users/${user?.id}`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to leave organization",
        description: error.message || "An error occurred while trying to leave.",
        variant: "destructive",
      });
    },
  });
  
  const { mutate: deleteOrganization, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/organizations/${params?.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Organization deleted",
        description: "The organization has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setLocation("/organizations");
    },
    onError: (error) => {
      toast({
        title: "Failed to delete organization",
        description: error.message || "An error occurred while trying to delete the organization.",
        variant: "destructive",
      });
    },
  });
  
  const handleJoinOrganization = () => {
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    joinOrganization();
  };
  
  const handleNewCompetitionSuccess = () => {
    setShowNewCompetitionDialog(false);
    queryClient.invalidateQueries({ queryKey: [`/api/organizations/${params?.id}/competitions`] });
  };
  
  const handleEditOrganizationSuccess = (updatedOrg: Organization) => {
    setShowEditOrgDialog(false);
    queryClient.invalidateQueries({ queryKey: [`/api/organizations/${params?.id}`] });
  };
  
  if (!match) {
    return null;
  }
  
  if (isOrgLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!organization) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Organization not found</h2>
        <p className="text-gray-600 mt-2">The organization you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }
  
  const formatDate = (date: Date) => {
    return format(new Date(date), "MMMM d, yyyy");
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
          <p className="text-gray-600">
            Created on {formatDate(organization.createdAt)}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setShowEditOrgDialog(true)}
              >
                Edit Organization
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setShowNewCompetitionDialog(true)}
              >
                <Trophy className="mr-2 h-4 w-4" />
                New Competition
              </Button>
              
              <Button 
                variant="destructive"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this organization? This action cannot be undone.")) {
                    deleteOrganization();
                  }
                }}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Organization"}
              </Button>
            </>
          )}
          
          {user && !isMember && (
            <Button onClick={handleJoinOrganization} disabled={isJoining}>
              {isJoining ? "Joining..." : "Join Organization"}
            </Button>
          )}
          
          {user && isMember && !isAdmin && (
            <Button 
              variant="outline" 
              onClick={() => {
                if (window.confirm("Are you sure you want to leave this organization?")) {
                  leaveOrganization();
                }
              }}
              disabled={isLeaving}
            >
              {isLeaving ? "Leaving..." : "Leave Organization"}
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-2 flex items-center">
                <Info className="mr-2 h-5 w-5 text-gray-500" /> About
              </h2>
              <p className="text-gray-700">
                {organization.description || "No description provided."}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Users className="mr-2 h-5 w-5 text-gray-500" /> Members
              </h2>
              <div className="flex flex-col space-y-4">
                {isMembersLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-gray-500">
                      {members?.length || 0} member{members?.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex flex-wrap -space-x-2">
                      {members?.slice(0, 5).map((member) => (
                        <Avatar key={member.userId} className="border-2 border-white">
                          <AvatarImage src={member.user.profileImageUrl || ""} />
                          <AvatarFallback>
                            {member.user.username?.substring(0, 2) || "U"}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {members && members.length > 5 && (
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 border-2 border-white text-xs font-medium text-gray-700">
                          +{members.length - 5}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Tabs defaultValue="competitions">
        <TabsList>
          <TabsTrigger value="competitions">
            <Trophy className="mr-2 h-4 w-4" /> Competitions
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" /> Members
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="competitions" className="space-y-6 py-4">
          {isCompetitionsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : competitions && competitions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {competitions.map(competition => (
                <CompetitionCard 
                  key={competition.id} 
                  competition={{
                    ...competition,
                    organization
                  }}
                  isAdminView={isAdmin}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No competitions yet</h3>
              <p className="text-gray-600 mb-4">
                {isAdmin 
                  ? "Create a competition for members to participate in"
                  : "This organization hasn't created any competitions yet"}
              </p>
              {isAdmin && (
                <Button onClick={() => setShowNewCompetitionDialog(true)}>
                  Create Competition
                </Button>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="members" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Members</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  {
                    header: "Member",
                    accessorKey: "user",
                    cell: (row) => (
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={row.user.profileImageUrl || ""} />
                          <AvatarFallback>
                            {row.user.username?.substring(0, 2) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{row.user.username || "Unknown"}</div>
                          <div className="text-sm text-gray-500">
                            {row.user.email || "No email"}
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    header: "Role",
                    accessorKey: "isAdmin",
                    cell: (row) => (
                      <Badge className={row.isAdmin ? "bg-blue-100 text-primary" : "bg-gray-100 text-gray-800"}>
                        {row.isAdmin ? "Admin" : "Member"}
                      </Badge>
                    ),
                  },
                  {
                    header: "Joined",
                    accessorKey: "joinedAt",
                    cell: (row) => formatDate(row.joinedAt),
                  },
                  {
                    header: "Actions",
                    accessorKey: "actions",
                    cell: (row) => (
                      isAdmin && row.userId !== user?.id && (
                        <Button variant="outline" size="sm">
                          {row.isAdmin ? "Remove Admin" : "Make Admin"}
                        </Button>
                      )
                    ),
                  },
                ]}
                data={members || []}
                isLoading={isMembersLoading}
                emptyState={
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No members yet</h3>
                    <p className="text-gray-600">This organization doesn't have any members yet</p>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* New Competition Dialog */}
      <Dialog open={showNewCompetitionDialog} onOpenChange={setShowNewCompetitionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Competition</DialogTitle>
          </DialogHeader>
          <CompetitionForm 
            organizationId={parseInt(params?.id || "0")} 
            onSuccess={handleNewCompetitionSuccess} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Organization Dialog */}
      <Dialog open={showEditOrgDialog} onOpenChange={setShowEditOrgDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
          </DialogHeader>
          <OrganizationForm 
            organization={organization} 
            onSuccess={handleEditOrganizationSuccess} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
