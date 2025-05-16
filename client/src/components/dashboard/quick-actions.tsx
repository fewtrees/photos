import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Plus, FolderPlus, UserCog, Trophy } from "lucide-react";
import { PhotoUploadModal } from "@/components/photos/photo-upload-modal";
import { Link } from "wouter";

export function QuickActions() {
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button 
              className="inline-flex items-center" 
              onClick={() => setIsPhotoModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Photo
            </Button>
            
            <Button 
              className="inline-flex items-center bg-secondary hover:bg-green-700"
              asChild
            >
              <Link href="/galleries/new">
                <FolderPlus className="h-4 w-4 mr-2" /> Create Gallery
              </Link>
            </Button>
            
            <Button 
              className="inline-flex items-center bg-accent hover:bg-amber-600"
              asChild
            >
              <Link href="/organizations">
                <UserCog className="h-4 w-4 mr-2" /> Manage Organization
              </Link>
            </Button>
            
            <Button 
              className="inline-flex items-center bg-purple-500 hover:bg-purple-700"
              asChild
            >
              <Link href="/competitions">
                <Trophy className="h-4 w-4 mr-2" /> View Competitions
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <PhotoUploadModal 
        isOpen={isPhotoModalOpen} 
        onClose={() => setIsPhotoModalOpen(false)}
      />
    </>
  );
}
