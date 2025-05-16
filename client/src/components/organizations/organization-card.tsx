import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrganizationWithStats } from "@/lib/types";
import { Link } from "wouter";
import { Camera, Users, Calendar } from "lucide-react";

interface OrganizationCardProps {
  organization: OrganizationWithStats;
}

export function OrganizationCard({ organization }: OrganizationCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-5">
        <div className="flex items-center mb-4">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Camera className="text-primary text-xl" />
          </div>
          <div className="ml-4">
            <h3 className="font-semibold text-gray-900">{organization.name}</h3>
            <p className="text-sm text-gray-500">{organization.memberCount || 0} Members</p>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center">
            {organization.isAdmin ? (
              <Badge className="mr-2 bg-blue-100 text-primary">Admin</Badge>
            ) : (
              <Badge className="mr-2 bg-gray-100 text-gray-800">Member</Badge>
            )}
            <span className="text-xs text-gray-500">
              Created on <span>{formatDate(organization.createdAt)}</span>
            </span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">{organization.description}</p>
        
        {organization.competitions && organization.competitions.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">Active Competitions</h4>
              <Badge className="bg-purple-100 text-purple-800">
                {organization.competitions.filter(c => c.isActive).length}
              </Badge>
            </div>
            <ul className="space-y-2">
              {organization.competitions.slice(0, 2).map(competition => (
                <li key={competition.id} className="flex justify-between items-center">
                  <span className="text-sm">{competition.name}</span>
                  <span className="text-xs text-gray-500">
                    {competition.endDate ? (
                      `Ends ${formatDate(competition.endDate)}`
                    ) : (
                      "No end date"
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 px-5 py-3 flex justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/organizations/${organization.id}`}>
            {organization.isAdmin ? "Manage" : "View Details"}
          </Link>
        </Button>
        
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/organizations/${organization.id}/members`}>
            <Users className="mr-1 h-4 w-4" /> View Members
          </Link>
        </Button>
      </div>
    </Card>
  );
}
