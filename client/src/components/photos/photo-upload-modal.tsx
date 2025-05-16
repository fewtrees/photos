import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { photoValidator } from "@/lib/validators";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState } from "react";
import { Upload } from "lucide-react";
import { Gallery } from "@shared/schema";

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PhotoUploadModal({ isOpen, onClose }: PhotoUploadModalProps) {
  const { toast } = useToast();
  const [newGalleryName, setNewGalleryName] = useState("");
  const [showNewGalleryInput, setShowNewGalleryInput] = useState(false);
  
  // Fetch user's galleries
  const { data: galleries, isLoading: isLoadingGalleries } = useQuery<Gallery[]>({
    queryKey: ["/api/galleries/user/:userId"],
    enabled: isOpen,
  });

  const form = useForm<z.infer<typeof photoValidator>>({
    resolver: zodResolver(photoValidator),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      isPublic: true,
    },
  });

  const { mutate: createPhoto, isPending: isCreatingPhoto } = useMutation({
    mutationFn: async (data: z.infer<typeof photoValidator>) => {
      return await apiRequest("POST", "/api/photos", data);
    },
    onSuccess: () => {
      toast({
        title: "Photo added",
        description: "Your photo has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/photos/user/:userId"] });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to add photo",
        description: error.message || "An error occurred while adding your photo.",
        variant: "destructive",
      });
    },
  });

  const { mutate: createGallery, isPending: isCreatingGallery } = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("POST", "/api/galleries", { name, isPublic: true });
    },
    onSuccess: (response) => {
      const newGallery = response.json();
      toast({
        title: "Gallery created",
        description: "Your new gallery has been created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/galleries/user/:userId"] });
      // Set the new gallery as selected
      form.setValue("galleryId", newGallery.id);
      setShowNewGalleryInput(false);
      setNewGalleryName("");
    },
    onError: (error) => {
      toast({
        title: "Failed to create gallery",
        description: error.message || "An error occurred while creating your gallery.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof photoValidator>) => {
    createPhoto(data);
  };

  const handleGalleryChange = (value: string) => {
    if (value === "new") {
      setShowNewGalleryInput(true);
      form.setValue("galleryId", undefined);
    } else if (value) {
      form.setValue("galleryId", parseInt(value));
      setShowNewGalleryInput(false);
    } else {
      form.setValue("galleryId", undefined);
      setShowNewGalleryInput(false);
    }
  };

  const handleCreateGallery = () => {
    if (newGalleryName.trim()) {
      createGallery(newGalleryName.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Upload Photo
          </DialogTitle>
          <DialogDescription>
            Add a new photo to your collection. Enter the URL of your photo from a photo sharing website.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://flickr.com/photos/your-photo-url" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter a title for your photo" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add a description" 
                      rows={3} 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <Label htmlFor="gallery">Gallery</Label>
              <Select 
                onValueChange={handleGalleryChange}
                disabled={isLoadingGalleries}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a gallery" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {galleries?.map((gallery) => (
                    <SelectItem key={gallery.id} value={gallery.id.toString()}>
                      {gallery.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">+ Create new gallery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {showNewGalleryInput && (
              <div className="flex gap-2">
                <Input
                  placeholder="New gallery name"
                  value={newGalleryName}
                  onChange={(e) => setNewGalleryName(e.target.value)}
                />
                <Button 
                  type="button" 
                  onClick={handleCreateGallery}
                  disabled={isCreatingGallery || !newGalleryName.trim()}
                >
                  Create
                </Button>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Privacy</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value === "public")}
                      defaultValue={field.value ? "public" : "private"}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="public" id="public" />
                        <Label htmlFor="public">Public</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="private" id="private" />
                        <Label htmlFor="private">Private</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isCreatingPhoto}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isCreatingPhoto}
              >
                {isCreatingPhoto ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
