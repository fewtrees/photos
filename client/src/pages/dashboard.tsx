import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Camera, Images, Users, Trophy } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { GalleryCard } from "@/components/galleries/gallery-card";
import { OrganizationCard } from "@/components/organizations/organization-card";
import { Link } from "wouter";
import { PhotoWithUser, UserStats, OrganizationWithStats, GalleryWithStats } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  // Fetch user stats
  const { data: userStats, isLoading: isStatsLoading } = useQuery<UserStats>({
    queryKey: [`/api/users/${user?.id}/stats`],
    enabled: !!user?.id,
  });
  
  // Fetch recent photos
  const { data: recentPhotos, isLoading: isPhotosLoading } = useQuery<PhotoWithUser[]>({
    queryKey: ["/api/photos"],
    queryFn: async () => {
      const res = await fetch("/api/photos?limit=4");
      if (!res.ok) throw new Error("Failed to fetch photos");
      return res.json();
    },
  });
  
  // Fetch user's organizations
  const { data: organizations, isLoading: isOrgsLoading } = useQuery<OrganizationWithStats[]>({
    queryKey: [`/api/organizations/user/${user?.id}`],
    enabled: !!user?.id,
  });
  
  // Fetch user's galleries
  const { data: galleries, isLoading: isGalleriesLoading } = useQuery<GalleryWithStats[]>({
    queryKey: [`/api/galleries/user/${user?.id}`],
    enabled: !!user?.id,
  });
  
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Photosphere</h1>
        <p className="text-lg text-gray-600 mb-8">
          The platform for photographers to share, connect, and compete.
        </p>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
          <Button size="lg" asChild>
            <a href="/api/login">Sign In</a>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/photos">
              <a>Browse Photos</a>
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="My Photos" 
          value={userStats?.photoCount ?? 0} 
          icon={Camera} 
          color="border-primary" 
        />
        <StatsCard 
          title="My Galleries" 
          value={userStats?.galleryCount ?? 0} 
          icon={Images} 
          color="border-secondary" 
        />
        <StatsCard 
          title="Organizations" 
          value={userStats?.organizationCount ?? 0} 
          icon={Users} 
          color="border-accent" 
        />
        <StatsCard 
          title="Active Competitions" 
          value={userStats?.competitionCount ?? 0} 
          icon={Trophy} 
          color="border-purple-500" 
        />
      </div>
      
      {/* Quick actions */}
      <QuickActions />
      
      {/* Recent Photos */}
      <section className="space-y-6 pb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Recent Photos</h2>
          <Link href="/photos" className="text-primary hover:text-blue-700 text-sm font-medium">
            View All
          </Link>
        </div>
        
        {isPhotosLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <PhotoGrid photos={recentPhotos || []} />
        )}
      </section>
      
      {/* My Organizations */}
      <section className="space-y-6 pb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">My Organizations</h2>
          <Link href="/organizations" className="text-primary hover:text-blue-700 text-sm font-medium">
            View All
          </Link>
        </div>
        
        {isOrgsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {organizations && organizations.length > 0 ? (
              <>
                {organizations.slice(0, 2).map(org => (
                  <OrganizationCard key={org.id} organization={org} />
                ))}
                
                <Card className="border-2 border-dashed border-gray-300 flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Users className="h-5 w-5 text-gray-400" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">Create Organization</h3>
                    <p className="text-sm text-gray-500 mb-4">Start a new photography community</p>
                    <Button asChild>
                      <Link href="/organizations/new">
                        Create Now
                      </Link>
                    </Button>
                  </div>
                </Card>
              </>
            ) : (
              <div className="col-span-3 text-center py-12">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">No Organizations Yet</h3>
                <p className="text-sm text-gray-500 mb-4">Create an organization to connect with other photographers</p>
                <Button asChild>
                  <Link href="/organizations/new">
                    Create Organization
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </section>
      
      {/* My Galleries */}
      <section className="space-y-6 pb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">My Galleries</h2>
          <Link href="/galleries" className="text-primary hover:text-blue-700 text-sm font-medium">
            Manage Galleries
          </Link>
        </div>
        
        {isGalleriesLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {galleries && galleries.length > 0 ? (
              <>
                {galleries.slice(0, 3).map(gallery => (
                  <GalleryCard key={gallery.id} gallery={gallery} />
                ))}
                
                <Card className="border-2 border-dashed border-gray-300 flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Images className="h-5 w-5 text-gray-400" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">Create Gallery</h3>
                    <p className="text-sm text-gray-500 mb-4">Organize your photos into a new collection</p>
                    <Button className="bg-secondary hover:bg-green-700" asChild>
                      <Link href="/galleries/new">
                        Create Gallery
                      </Link>
                    </Button>
                  </div>
                </Card>
              </>
            ) : (
              <div className="col-span-4 text-center py-12">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Images className="h-5 w-5 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">No Galleries Yet</h3>
                <p className="text-sm text-gray-500 mb-4">Create a gallery to organize your photos</p>
                <Button className="bg-secondary hover:bg-green-700" asChild>
                  <Link href="/galleries/new">
                    Create Gallery
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
