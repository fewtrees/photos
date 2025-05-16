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
import { organizationValidator } from "@/lib/validators";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Organization } from "@shared/schema";

interface OrganizationFormProps {
  organization?: Organization;
  onSuccess: (data: Organization) => void;
}

export function OrganizationForm({ organization, onSuccess }: OrganizationFormProps) {
  const { toast } = useToast();
  const isEditing = !!organization;
  
  const form = useForm<z.infer<typeof organizationValidator>>({
    resolver: zodResolver(organizationValidator),
    defaultValues: {
      name: organization?.name || "",
      description: organization?.description || "",
    },
  });

  const { mutate: submitOrganization, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof organizationValidator>) => {
      if (isEditing) {
        return await apiRequest("PUT", `/api/organizations/${organization.id}`, data);
      } else {
        return await apiRequest("POST", "/api/organizations", data);
      }
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: isEditing ? "Organization updated" : "Organization created",
        description: isEditing
          ? "Your organization has been updated successfully."
          : "Your organization has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations/user/:userId"] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: [`/api/organizations/${organization.id}`] });
      }
      onSuccess(data);
    },
    onError: (error) => {
      toast({
        title: isEditing ? "Failed to update organization" : "Failed to create organization",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof organizationValidator>) => {
    submitOrganization(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Organization" : "Create Organization"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter organization name" {...field} />
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
                      placeholder="Enter a description for your organization" 
                      rows={4} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
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
                isEditing ? "Update Organization" : "Create Organization"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
