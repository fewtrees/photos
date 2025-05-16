import { Photo, User } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { useState } from "react";
import { Eye, Heart, Star, Calendar, Edit, Trash, Share } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { RatingResponse } from "@/lib/types";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PhotoDetailsProps {
  photo: Photo & { user?: User };
  onDelete?: () => void;
}

export function PhotoDetails({ photo, onDelete }: PhotoDetailsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const isOwner = user?.id === photo.userId;
  
  const { data: ratingsData } = useQuery<RatingResponse>({
    queryKey: [`/api/photos/${photo.id}/ratings`],
    enabled: !!photo.id,
  });

  const { mutate: ratePhoto } = useMutation({
    mutationFn: async (rating: number) => {
      return await apiRequest("POST", `/api/photos/${photo.id}/rate`, {
        rating,
        isCompetitionRating: false,
      });
    },
    onSuccess: () => {
      toast({
        title: "Photo rated",
        description: "Your rating has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/photos/${photo.id}/ratings`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to rate photo",
        description: error.message || "An error occurred while rating the photo.",
        variant: "destructive",
      });
    },
  });

  const { mutate: deletePhoto, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/photos/${photo.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Photo deleted",
        description: "The photo has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/photos/user/:userId"] });
      if (onDelete) onDelete();
    },
    onError: (error) => {
      toast({
        title: "Failed to delete photo",
        description: error.message || "An error occurred while deleting the photo.",
        variant: "destructive",
      });
    },
  });

  const handleRating = (value: number) => {
    setRating(value);
    ratePhoto(value);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name?: string) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="relative pb-[66.67%]">
            <img 
              className="absolute inset-0 w-full h-full object-cover" 
              src={photo.imageUrl} 
              alt={photo.title} 
            />
          </div>
          
          <div className="p-4">
            <div className="flex flex-wrap justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">{photo.title}</h1>
              <Badge variant={photo.isPublic ? "default" : "secondary"}>
                {photo.isPublic ? "Public" : "Private"}
              </Badge>
            </div>
            
            <p className="mt-2 text-gray-600">{photo.description}</p>
            
            <div className="flex flex-wrap items-center mt-4 space-x-6">
              <div className="flex items-center text-gray-500">
                <Eye className="h-5 w-5 mr-1" />
                <span>{photo.viewCount} views</span>
              </div>
              <div className="flex items-center text-gray-500">
                <Calendar className="h-5 w-5 mr-1" />
                <span>{formatDate(photo.createdAt)}</span>
              </div>
              <div className="flex items-center text-yellow-500">
                <Star className="h-5 w-5 mr-1" />
                <span>{ratingsData?.avgRating?.toFixed(1) || "-"} ({ratingsData?.ratings.length || 0} ratings)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Photographer</h2>
              <Link href={`/profile/${photo.userId}`}>
                <a className="text-primary text-sm">View Profile</a>
              </Link>
            </div>
            
            <div className="flex items-center mt-4">
              <Avatar className="h-12 w-12">
                <AvatarImage 
                  src={photo.user?.profileImageUrl || ""} 
                  alt={photo.user?.username || "user"} 
                />
                <AvatarFallback>
                  {getInitials(photo.user?.username)}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="font-medium text-gray-900">{photo.user?.username || "Unknown"}</p>
                <p className="text-sm text-gray-500">
                  {photo.user?.firstName} {photo.user?.lastName}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold mb-4">Rate this photo</h2>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((value) => (
                <button 
                  key={value} 
                  className={`p-1 ${rating >= value ? 'text-yellow-400' : 'text-gray-300'}`}
                  onClick={() => handleRating(value)}
                >
                  <Star className="h-6 w-6" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {isOwner && (
          <Card>
            <CardContent className="p-5">
              <h2 className="text-lg font-semibold mb-4">Photo Actions</h2>
              <div className="space-y-3">
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href={`/photos/${photo.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" /> Edit Photo
                  </Link>
                </Button>
                
                <Button className="w-full justify-start" variant="outline">
                  <Share className="h-4 w-4 mr-2" /> Share Photo
                </Button>
                
                <Separator />
                
                <Button 
                  className="w-full justify-start" 
                  variant="destructive"
                  onClick={() => deletePhoto()}
                  disabled={isDeleting}
                >
                  <Trash className="h-4 w-4 mr-2" /> 
                  {isDeleting ? "Deleting..." : "Delete Photo"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
