import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { PhotoDetails } from "@/components/photos/photo-details";
import { Photo, User } from "@shared/schema";
import { useEffect } from "react";

export default function PhotoDetailsPage() {
  const [match, params] = useRoute<{ id: string }>("/photos/:id");
  const [, setLocation] = useLocation();

  const { data: photo, isLoading, error } = useQuery<Photo & { user: User }>({
    queryKey: [`/api/photos/${params?.id}`],
    enabled: !!params?.id,
    queryFn: async () => {
      const res = await fetch(`/api/photos/${params?.id}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Photo not found");
        }
        throw new Error("Failed to fetch photo details");
      }
      return res.json();
    },
  });

  useEffect(() => {
    if (error) {
      setLocation("/photos");
    }
  }, [error, setLocation]);

  if (!match) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Photo not found</h2>
        <p className="text-gray-600 mt-2">The photo you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  const handleDelete = () => {
    setLocation("/photos");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Photo Details</h1>
      <PhotoDetails photo={photo} onDelete={handleDelete} />
    </div>
  );
}
