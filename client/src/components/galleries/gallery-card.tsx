import { Card } from "@/components/ui/card";
import { GalleryWithStats } from "@/lib/types";
import { Link } from "wouter";
import { Eye, Heart, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

interface GalleryCardProps {
  gallery: GalleryWithStats;
}

export function GalleryCard({ gallery }: GalleryCardProps) {
  const { user } = useAuth();
  const isOwner = user?.id === gallery.userId;

  return (
    <Card className="overflow-hidden group h-full">
      <div className="relative pb-[66.67%]">
        <Link href={`/galleries/${gallery.id}`}>
          <a>
            <img 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
              src={gallery.coverImageUrl || "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=533"} 
              alt={gallery.name} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:opacity-75 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-semibold text-lg">{gallery.name}</h3>
                <p className="text-gray-200 text-sm">{gallery.photos?.length || 0} photos</p>
                
                {!gallery.isPublic && (
                  <div className="flex items-center mt-2">
                    <Badge className="bg-gray-800/60 text-white">
                      Private
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </a>
        </Link>
      </div>
      
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center">
          <span className="inline-flex items-center text-sm text-gray-500">
            <Eye className="h-4 w-4 mr-1" />
            <span>{gallery.viewCount}</span>
          </span>
          <span className="inline-flex items-center text-sm text-gray-500 ml-4">
            <Heart className="h-4 w-4 mr-1" />
            <span>{gallery.likeCount}</span>
          </span>
        </div>
        
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-500 hover:text-primary focus:outline-none">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/galleries/${gallery.id}/edit`}>
                <DropdownMenuItem className="cursor-pointer">
                  Edit Gallery
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem className="cursor-pointer text-red-600">
                Delete Gallery
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Card>
  );
}
