import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Gallery, Photo, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { GalleryForm } from "@/components/galleries/gallery-form";
import { PhotoUploadModal } from "@/components/photos/photo-upload-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { PhotoWithUser } from "@/lib/types";
import { Link } from "wouter";
import { Eye, Heart, Calendar, Edit, Trash, Images, Plus } from "lucide-react";
import { format } from "date-fns";

export default function GalleryDetailsPage() {
  const [match, params] = useRoute<{ id: string }>("/galleries/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  
  const { data: gallery, isLoading: isGalleryLoading } = useQuery<Gallery & { user: User }>({
    queryKey: [`/api/galleries/${params?.id}`],
    enabled: !!params?.id,
    queryFn: async () => {
      const res = await fetch(`/api/galleries/${params?.id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Gallery not found");
        throw new Error("Failed to fetch gallery details");
      }
      return res.json();
    },
  });
  
  const { data: photos, isLoading: isPhotosLoading } = useQuery<PhotoWithUser[]>({
    queryKey: [`/api/galleries/${params?.id}/photos`],
    enabled: !!params?.id,
    queryFn: async () => {
      const res = await fetch(`/api/galleries/${params?.id}/photos`);
      if (!res.ok) throw new Error("Failed to fetch gallery photos");
      return res.json();
    },
  });
  
  const isOwner = user?.id === gallery?.userId;
  
  const { mutate: deleteGallery, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/galleries/${params?.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Gallery deleted",
        description: "The gallery has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/galleries/user/:userId"] });
      setLocation("/galleries");
    },
    onError: (error) => {
      toast({
        title: "Failed to delete gallery",
        description: error.message || "An error occurred while trying to delete the gallery.",
        variant: "destructive",
      });
    },
  });
  
  const handleEditSuccess = (updatedGallery: Gallery) => {
    setShowEditDialog(false);
    queryClient.invalidateQueries({ queryKey: [`/api/galleries/${params?.id}`] });
  };
  
  const handlePhotoUploadSuccess = () => {
    setShowPhotoUploadModal(false);
    queryClient.invalidateQueries({ queryKey: [`/api/galleries/${params?.id}/photos`] });
  };
  
  if (!match) {
    return null;
  }
  
  if (isGalleryLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!gallery) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Gallery not found</h2>
        <p className="text-gray-600 mt-2">The gallery you're looking for doesn't exist or has been removed.</p>
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
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">{gallery.name}</h1>
            <Badge className="ml-3" variant={gallery.isPublic ? "default" : "secondary"}>
              {gallery.isPublic ? "Public" : "Private"}
            </Badge>
          </div>
          <p className="text-gray-600">
            Created on {formatDate(gallery.createdAt)}
          </p>
        </div>
        
        {isOwner && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Gallery
            </Button>
            
            <Button variant="outline" onClick={() => setShowPhotoUploadModal(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Photos
            </Button>
            
            <Button 
              variant="destructive"
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this gallery? This action cannot be undone.")) {
                  deleteGallery();
                }
              }}
              disabled={isDeleting}
            >
              <Trash className="mr-2 h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete Gallery"}
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-700">
                {gallery.description || "No description provided."}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={gallery.user?.profileImageUrl || ""} 
                    alt={gallery.user?.username || "user"} 
                  />
                  <AvatarFallback>
                    {gallery.user?.username?.substring(0, 2) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4">
                  <div className="font-medium">{gallery.user?.username || "Unknown"}</div>
                  <Link href={`/profile/${gallery.userId}`}>
                    <a className="text-sm text-primary">View Profile</a>
                  </Link>
                </div>
              </div>
              
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" /> Created:
                  </span>
                  <span className="font-medium">{formatDate(gallery.createdAt)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center">
                    <Eye className="h-4 w-4 mr-1" /> Views:
                  </span>
                  <span className="font-medium">{gallery.viewCount}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center">
                    <Heart className="h-4 w-4 mr-1" /> Likes:
                  </span>
                  <span className="font-medium">{gallery.likeCount}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center">
                    <Images className="h-4 w-4 mr-1" /> Photos:
                  </span>
                  <span className="font-medium">{photos?.length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Photos in this Gallery</h2>
        
        {isPhotosLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : photos && photos.length > 0 ? (
          <PhotoGrid photos={photos} />
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Images className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No photos in this gallery</h3>
            {isOwner ? (
              <>
                <p className="text-gray-600 mb-4">
                  Add photos to your gallery to display them here
                </p>
                <Button onClick={() => setShowPhotoUploadModal(true)}>
                  Add Photos
                </Button>
              </>
            ) : (
              <p className="text-gray-600">
                The gallery owner hasn't added any photos yet
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Edit Gallery Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Gallery</DialogTitle>
          </DialogHeader>
          <GalleryForm gallery={gallery} onSuccess={handleEditSuccess} />
        </DialogContent>
      </Dialog>
      
      {/* Photo Upload Modal */}
      <PhotoUploadModal 
        isOpen={showPhotoUploadModal} 
        onClose={() => setShowPhotoUploadModal(false)} 
      />
    </div>
  );
}
