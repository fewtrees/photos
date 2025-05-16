import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Competition, Organization, Photo, CompetitionPhoto } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CompetitionPhotoWithDetails, PhotoWithUser } from "@/lib/types";
import { Link } from "wouter";
import { 
  Building, 
  Calendar, 
  Trophy, 
  Check, 
  Star, 
  Users, 
  Info,
  Trash
} from "lucide-react";
import { format } from "date-fns";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { CompetitionForm } from "@/components/competitions/competition-form";

export default function CompetitionDetailsPage() {
  const [match, params] = useRoute<{ id: string }>("/competitions/:id");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  
  const { data: competition, isLoading: isCompetitionLoading } = useQuery<Competition & { organization: Organization }>({
    queryKey: [`/api/competitions/${params?.id}`],
    enabled: !!params?.id,
    queryFn: async () => {
      const res = await fetch(`/api/competitions/${params?.id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Competition not found");
        throw new Error("Failed to fetch competition details");
      }
      return res.json();
    },
  });
  
  const { data: photos, isLoading: isPhotosLoading } = useQuery<CompetitionPhotoWithDetails[]>({
    queryKey: [`/api/competitions/${params?.id}/photos`],
    enabled: !!params?.id,
    queryFn: async () => {
      const res = await fetch(`/api/competitions/${params?.id}/photos`);
      if (!res.ok) throw new Error("Failed to fetch competition photos");
      return res.json();
    },
  });
  
  // Fetch user photos for submission (if authenticated)
  const { data: userPhotos, isLoading: isUserPhotosLoading } = useQuery<Photo[]>({
    queryKey: [`/api/photos/user/${user?.id}`],
    enabled: !!user?.id && isAuthenticated,
    queryFn: async () => {
      const res = await fetch(`/api/photos/user/${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch user photos");
      return res.json();
    },
  });
  
  // Check if user is org admin
  const { data: isOrgAdmin } = useQuery<boolean>({
    queryKey: [`/api/organizations/${competition?.organizationId}/isadmin`],
    enabled: !!competition?.organizationId && !!user?.id,
    queryFn: async () => {
      try {
        const res = await fetch(`/api/organizations/${competition?.organizationId}/isadmin`);
        if (!res.ok) return false;
        const data = await res.json();
        return data.isAdmin || false;
      } catch (error) {
        return false;
      }
    },
  });
  
  // Check if user is org member
  const { data: isOrgMember } = useQuery<boolean>({
    queryKey: [`/api/organizations/${competition?.organizationId}/ismember`],
    enabled: !!competition?.organizationId && !!user?.id,
    queryFn: async () => {
      try {
        const res = await fetch(`/api/organizations/${competition?.organizationId}/ismember`);
        if (!res.ok) return false;
        const data = await res.json();
        return data.isMember || false;
      } catch (error) {
        return false;
      }
    },
  });
  
  // Extract enhancement data
  const photoList: PhotoWithUser[] = photos?.map(p => ({
    ...p.photo,
    user: p.user,
    avgRating: 0 // Will be filled by ratings query
  })) || [];
  
  // Enhance user photos by checking which are already submitted
  const submittedPhotoIds = photos?.map(p => p.photo.id) || [];
  const userPhotosForSubmission = userPhotos?.filter(photo => 
    !submittedPhotoIds.includes(photo.id)
  ) || [];
  
  const { mutate: submitPhoto, isPending: isSubmitting } = useMutation({
    mutationFn: async (photoId: number) => {
      return await apiRequest("POST", `/api/competitions/${params?.id}/photos`, {
        photoId,
      });
    },
    onSuccess: () => {
      toast({
        title: "Photo submitted",
        description: "Your photo has been submitted to the competition.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/competitions/${params?.id}/photos`] });
      setShowSubmitDialog(false);
      setSelectedPhoto(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to submit photo",
        description: error.message || "An error occurred while submitting your photo.",
        variant: "destructive",
      });
    },
  });
  
  const { mutate: deleteCompetition, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/competitions/${params?.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Competition deleted",
        description: "The competition has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      setLocation("/competitions");
    },
    onError: (error) => {
      toast({
        title: "Failed to delete competition",
        description: error.message || "An error occurred while deleting the competition.",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmitPhoto = () => {
    if (selectedPhoto) {
      submitPhoto(selectedPhoto);
    }
  };
  
  const handleEditSuccess = () => {
    setShowEditDialog(false);
    queryClient.invalidateQueries({ queryKey: [`/api/competitions/${params?.id}`] });
  };
  
  const handlePhotoRemoved = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/competitions/${params?.id}/photos`] });
  };
  
  if (!match) {
    return null;
  }
  
  if (isCompetitionLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!competition) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Competition not found</h2>
        <p className="text-gray-600 mt-2">The competition you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }
  
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Not specified";
    return format(new Date(date), "MMMM d, yyyy");
  };
  
  const getDaysRemaining = (endDate: Date | null | undefined) => {
    if (!endDate) return "No deadline";
    
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Ended";
    if (diffDays === 0) return "Ends today";
    return `Ends in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">{competition.name}</h1>
            <Badge className="ml-3" variant={competition.isActive ? "default" : "secondary"}>
              {competition.isActive ? "Active" : "Closed"}
            </Badge>
          </div>
          <p className="text-gray-600">
            {competition.organization.name}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {isOrgAdmin && (
            <>
              <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                Edit Competition
              </Button>
              
              <Button 
                variant="destructive"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this competition? This action cannot be undone.")) {
                    deleteCompetition();
                  }
                }}
                disabled={isDeleting}
              >
                <Trash className="mr-2 h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </>
          )}
          
          {isAuthenticated && isOrgMember && competition.isActive && (
            <Button onClick={() => setShowSubmitDialog(true)}>
              <Trophy className="mr-2 h-4 w-4" /> Submit Photo
            </Button>
          )}
          
          {isAuthenticated && !isOrgMember && competition.isActive && (
            <Button variant="outline" asChild>
              <Link href={`/organizations/${competition.organizationId}`}>
                <a>Join Organization to Submit</a>
              </Link>
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
                {competition.description || "No description provided."}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Trophy className="mr-2 h-5 w-5 text-gray-500" /> Competition Details
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Building className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Organization</div>
                    <Link href={`/organizations/${competition.organizationId}`}>
                      <a className="font-medium text-primary">
                        {competition.organization.name}
                      </a>
                    </Link>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Start Date</div>
                    <div className="font-medium">{formatDate(competition.startDate)}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">End Date</div>
                    <div className="font-medium">{formatDate(competition.endDate)}</div>
                  </div>
                </div>
                
                {competition.isActive && competition.endDate && (
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <div>
                      <div className="text-sm text-gray-500">Status</div>
                      <div className="font-medium text-green-600">
                        {getDaysRemaining(competition.endDate)}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-500 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Submissions</div>
                    <div className="font-medium">{photos?.length || 0} photos</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Competition Submissions</h2>
        
        {isPhotosLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : photoList.length > 0 ? (
          <PhotoGrid 
            photos={photoList} 
            isCompetition 
            competitionId={parseInt(params?.id || "0")} 
            onPhotoRemoved={handlePhotoRemoved} 
          />
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No submissions yet</h3>
            {competition.isActive ? (
              <>
                <p className="text-gray-600 mb-4">
                  Be the first to submit a photo to this competition
                </p>
                {isAuthenticated && isOrgMember && (
                  <Button onClick={() => setShowSubmitDialog(true)}>
                    Submit Photo
                  </Button>
                )}
                {isAuthenticated && !isOrgMember && (
                  <Button variant="outline" asChild>
                    <Link href={`/organizations/${competition.organizationId}`}>
                      <a>Join Organization to Submit</a>
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <p className="text-gray-600">
                This competition is closed and did not receive any submissions
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Edit Competition Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Competition</DialogTitle>
          </DialogHeader>
          <CompetitionForm 
            competition={competition} 
            organizationId={competition.organizationId} 
            onSuccess={handleEditSuccess} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Submit Photo Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Photo to Competition</DialogTitle>
          </DialogHeader>
          
          {isUserPhotosLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : userPhotosForSubmission.length > 0 ? (
            <>
              <div className="py-4">
                <p className="mb-4">Select one of your photos to submit to this competition:</p>
                <Select onValueChange={(value) => setSelectedPhoto(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a photo" />
                  </SelectTrigger>
                  <SelectContent>
                    {userPhotosForSubmission.map(photo => (
                      <SelectItem key={photo.id} value={photo.id.toString()}>
                        {photo.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSubmitDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitPhoto}
                  disabled={!selectedPhoto || isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Photo"}
                </Button>
              </div>
            </>
          ) : (
            <div className="py-6 text-center">
              <p className="mb-4">You don't have any eligible photos to submit.</p>
              <p className="text-gray-500 text-sm mb-4">
                All of your photos may already be submitted or you need to upload new photos first.
              </p>
              <Button asChild variant="outline">
                <Link href="/photos">
                  <a>Upload New Photos</a>
                </Link>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
