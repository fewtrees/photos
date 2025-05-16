import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { PhotoWithUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PhotoUploadModal } from "@/components/photos/photo-upload-modal";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function PhotosPage() {
  const { isAuthenticated } = useAuth();
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  const { data: photos, isLoading } = useQuery<PhotoWithUser[]>({
    queryKey: ["/api/photos", { page: currentPage, sort: sortBy, search: searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        page: currentPage.toString(),
        sort: sortBy,
      });
      
      if (searchTerm) {
        params.append("search", searchTerm);
      }
      
      const res = await fetch(`/api/photos?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch photos");
      return res.json();
    },
  });
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };
  
  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1); // Reset to first page when sort changes
  };
  
  const loadMorePhotos = () => {
    setCurrentPage(prev => prev + 1);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Photos</h1>
        {isAuthenticated && (
          <Button onClick={() => setIsPhotoModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Photo
          </Button>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-3/4">
          <Input
            placeholder="Search photos by title or description..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full"
          />
        </div>
        
        <div className="w-full md:w-1/4">
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <PhotoGrid 
        photos={photos || []} 
        isLoading={isLoading}
        hasMore={photos && photos.length >= itemsPerPage}
        loadMore={loadMorePhotos}
      />
      
      <PhotoUploadModal 
        isOpen={isPhotoModalOpen} 
        onClose={() => setIsPhotoModalOpen(false)} 
      />
    </div>
  );
}
