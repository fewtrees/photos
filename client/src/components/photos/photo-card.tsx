import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PhotoWithUser } from "@/lib/types";
import { Link } from "wouter";
import { Heart, Eye, Star, MoreHorizontal } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PhotoCardProps {
  photo: PhotoWithUser;
  isCompetition?: boolean;
  competitionId?: number;
  onDelete?: () => void;
}

export function PhotoCard({ photo, isCompetition, competitionId, onDelete }: PhotoCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isOwner = user?.id === photo.userId;
  
  const getInitials = (name?: string) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  const handleRemoveFromCompetition = async () => {
    if (!competitionId) return;
    
    try {
      await fetch(`/api/competitions/${competitionId}/photos/${photo.id}`, {
        method: 'DELETE',
      });
      
      toast({
        title: "Photo removed from competition",
      });
      
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: [`/api/competitions/${competitionId}/photos`] });
      if (onDelete) onDelete();
    } catch (error) {
      console.error("Failed to remove photo from competition:", error);
      toast({
        title: "Failed to remove photo",
        description: "Could not remove the photo from the competition.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden group h-full flex flex-col">
      <div className="relative pb-[66.67%]">
        <Link href={`/photos/${photo.id}`}>
          <a className="absolute inset-0 w-full h-full bg-gray-100">
            <img 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
              src={photo.imageUrl} 
              alt={photo.title} 
            />
            
            <div className="absolute top-2 right-2">
              <Badge variant={photo.isPublic ? "default" : "secondary"}>
                {photo.isPublic ? "Public" : "Private"}
              </Badge>
            </div>
            
            {isCompetition && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-purple-500">Competition</Badge>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-yellow-400 flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    <span className="text-white">{photo.avgRating?.toFixed(1) || "-"}</span>
                  </span>
                  <span className="text-white text-sm ml-2">
                    <Eye className="h-4 w-4 inline mr-1" />
                    <span>{photo.viewCount}</span>
                  </span>
                </div>
                <div>
                  <button className="text-white p-1 hover:text-yellow-400">
                    <Heart className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </a>
        </Link>
      </div>
      
      <CardContent className="p-4 flex-grow flex flex-col">
        <h3 className="font-medium text-gray-900 truncate mb-1">{photo.title}</h3>
        <p className="text-sm text-gray-500 truncate mb-2">
          {photo.galleryId ? "Gallery Name" : "Uncategorized"}
        </p>
        <div className="flex justify-between items-center mt-auto">
          <div className="flex items-center">
            <Avatar className="h-6 w-6">
              <AvatarImage 
                src={photo.user?.profileImageUrl || ""} 
                alt={photo.user?.username || "user"} 
              />
              <AvatarFallback>
                {getInitials(photo.user?.username)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-700 ml-2">
              {photo.user?.username || "Unknown"}
            </span>
          </div>
          
          {(isOwner || isCompetition) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-primary hover:text-blue-700 text-sm">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link href={`/photos/${photo.id}`}>
                    View Details
                  </Link>
                </DropdownMenuItem>
                
                {isOwner && (
                  <>
                    <DropdownMenuItem className="cursor-pointer" asChild>
                      <Link href={`/photos/${photo.id}/edit`}>
                        Edit Photo
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-red-600">
                      Delete Photo
                    </DropdownMenuItem>
                  </>
                )}
                
                {isCompetition && competitionId && (
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-600"
                    onClick={handleRemoveFromCompetition}
                  >
                    Remove from Competition
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
