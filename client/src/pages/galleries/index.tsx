import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { GalleryWithStats } from "@/lib/types";
import { GalleryCard } from "@/components/galleries/gallery-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Images, PlusCircle } from "lucide-react";
import { Link } from "wouter";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { GalleryForm } from "@/components/galleries/gallery-form";
import { Gallery } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

export default function GalleriesPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewGalleryDialog, setShowNewGalleryDialog] = useState(false);
  
  // Fetch user's galleries
  const { data: userGalleries, isLoading: isUserGalleriesLoading } = useQuery<GalleryWithStats[]>({
    queryKey: [`/api/galleries/user/${user?.id}`],
    enabled: !!user?.id,
  });
  
  // Fetch all public galleries
  const { data: publicGalleries, isLoading: isPublicGalleriesLoading } = useQuery<GalleryWithStats[]>({
    queryKey: ["/api/galleries"],
    queryFn: async () => {
      const res = await fetch("/api/galleries?public=true");
      if (!res.ok) throw new Error("Failed to fetch galleries");
      return res.json();
    },
  });
  
  // Filter galleries based on search term
  const filteredUserGalleries = userGalleries?.filter(gallery => {
    if (!searchTerm) return true;
    return (
      gallery.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gallery.description && gallery.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });
  
  const filteredPublicGalleries = publicGalleries?.filter(gallery => {
    // Exclude user's own galleries from public list
    if (user && gallery.userId === user.id) return false;
    
    if (!searchTerm) return true;
    return (
      gallery.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gallery.description && gallery.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });
  
  const handleNewGallerySuccess = (gallery: Gallery) => {
    setShowNewGalleryDialog(false);
  };
  
  if (isAuthLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Galleries</h1>
          <p className="text-gray-600">Explore and organize photographs in collections</p>
        </div>
        
        {isAuthenticated && (
          <Button onClick={() => setShowNewGalleryDialog(true)}>
            <PlusCircle className="h-4 w-4 mr-2" /> Create Gallery
          </Button>
        )}
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search galleries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Tabs defaultValue={isAuthenticated ? "my-galleries" : "public-galleries"}>
        <TabsList>
          {isAuthenticated && (
            <TabsTrigger value="my-galleries">My Galleries</TabsTrigger>
          )}
          <TabsTrigger value="public-galleries">Public Galleries</TabsTrigger>
        </TabsList>
        
        {isAuthenticated && (
          <TabsContent value="my-galleries" className="pt-6">
            {isUserGalleriesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredUserGalleries && filteredUserGalleries.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredUserGalleries.map(gallery => (
                  <GalleryCard key={gallery.id} gallery={gallery} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <Images className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                {searchTerm ? (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No galleries found</h3>
                    <p className="text-gray-600">
                      No galleries matching "{searchTerm}" were found
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No galleries yet</h3>
                    <p className="text-gray-600 mb-4">
                      Create your first gallery to organize your photos
                    </p>
                    <Button className="bg-secondary hover:bg-green-700" onClick={() => setShowNewGalleryDialog(true)}>
                      Create Gallery
                    </Button>
                  </>
                )}
              </div>
            )}
          </TabsContent>
        )}
        
        <TabsContent value="public-galleries" className="pt-6">
          {isPublicGalleriesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredPublicGalleries && filteredPublicGalleries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredPublicGalleries.map(gallery => (
                <GalleryCard key={gallery.id} gallery={gallery} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Images className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {searchTerm ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No galleries found</h3>
                  <p className="text-gray-600">
                    No public galleries matching "{searchTerm}" were found
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No public galleries yet</h3>
                  <p className="text-gray-600">
                    Be the first to create a public gallery
                  </p>
                </>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* New Gallery Dialog */}
      <Dialog open={showNewGalleryDialog} onOpenChange={setShowNewGalleryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Gallery</DialogTitle>
          </DialogHeader>
          <GalleryForm onSuccess={handleNewGallerySuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
