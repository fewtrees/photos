import { PhotoWithUser } from "@/lib/types";
import { PhotoCard } from "./photo-card";
import { Button } from "@/components/ui/button";

interface PhotoGridProps {
  photos: PhotoWithUser[];
  isLoading?: boolean;
  hasMore?: boolean;
  loadMore?: () => void;
  isCompetition?: boolean;
  competitionId?: number;
  onPhotoRemoved?: () => void;
}

export function PhotoGrid({ 
  photos, 
  isLoading, 
  hasMore, 
  loadMore,
  isCompetition,
  competitionId,
  onPhotoRemoved
}: PhotoGridProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-gray-500 text-lg">No photos found</h3>
        <p className="text-gray-400 text-sm mt-2">
          Photos you add will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {photos.map((photo) => (
          <PhotoCard 
            key={photo.id} 
            photo={photo}
            isCompetition={isCompetition}
            competitionId={competitionId}
            onDelete={onPhotoRemoved}
          />
        ))}
      </div>

      {hasMore && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2 animate-spin">◌</span>
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
