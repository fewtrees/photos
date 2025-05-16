import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { galleryValidator } from "@/lib/validators";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Gallery, Photo } from "@shared/schema";
import { useState } from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface GalleryFormProps {
  gallery?: Gallery;
  onSuccess: (data: Gallery) => void;
}

export function GalleryForm({ gallery, onSuccess }: GalleryFormProps) {
  const { toast } = useToast();
  const isEditing = !!gallery;
  const [selectedCoverPhoto, setSelectedCoverPhoto] = useState<number | undefined>(
    gallery?.coverPhotoId
  );
  
  // Fetch user's photos for cover photo selection
  const { data: photos } = useQuery<Photo[]>({
    queryKey: ["/api/photos/user/:userId"],
  });
  
  const form = useForm<z.infer<typeof galleryValidator>>({
    resolver: zodResolver(galleryValidator),
    defaultValues: {
      name: gallery?.name || "",
      description: gallery?.description || "",
      isPublic: gallery?.isPublic ?? true,
      coverPhotoId: gallery?.coverPhotoId,
    },
  });

  const { mutate: submitGallery, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof galleryValidator>) => {
      if (isEditing) {
        return await apiRequest("PUT", `/api/galleries/${gallery.id}`, data);
      } else {
        return await apiRequest("POST", "/api/galleries", data);
      }
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: isEditing ? "Gallery updated" : "Gallery created",
        description: isEditing
          ? "Your gallery has been updated successfully."
          : "Your gallery has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/galleries/user/:userId"] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: [`/api/galleries/${gallery.id}`] });
      }
      onSuccess(data);
    },
    onError: (error) => {
      toast({
        title: isEditing ? "Failed to update gallery" : "Failed to create gallery",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof galleryValidator>) => {
    // Add the selected cover photo ID to the form data
    const formData = { ...data };
    if (selectedCoverPhoto) {
      formData.coverPhotoId = selectedCoverPhoto;
    }
    submitGallery(formData);
  };

  const handleCoverPhotoChange = (value: string) => {
    if (value) {
      setSelectedCoverPhoto(parseInt(value));
      form.setValue("coverPhotoId", parseInt(value));
    } else {
      setSelectedCoverPhoto(undefined);
      form.setValue("coverPhotoId", undefined);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Gallery" : "Create Gallery"}</CardTitle>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gallery Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter gallery name" {...field} />
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
                      placeholder="Enter a description for your gallery" 
                      rows={4} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Cover Photo</FormLabel>
              <Select 
                onValueChange={handleCoverPhotoChange}
                defaultValue={gallery?.coverPhotoId?.toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a cover photo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {photos?.map((photo) => (
                    <SelectItem key={photo.id} value={photo.id.toString()}>
                      {photo.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Public Gallery
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Make this gallery visible to everyone
                    </div>
                  </div>
                  <FormControl>
                    <Switch 
                      checked={field.value} 
                      onCheckedChange={field.onChange} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-2">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <span className="animate-spin mr-2">◌</span>
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditing ? "Update Gallery" : "Create Gallery"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
