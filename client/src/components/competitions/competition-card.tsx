import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CompetitionWithStats } from "@/lib/types";
import { Calendar, Award, Users } from "lucide-react";

interface CompetitionCardProps {
  competition: CompetitionWithStats;
  isAdminView?: boolean;
}

export function CompetitionCard({ competition, isAdminView }: CompetitionCardProps) {
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "No end date";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getDaysRemaining = (endDate: Date | null | undefined) => {
    if (!endDate) return "No deadline";
    
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Ended";
    if (diffDays === 0) return "Ends today";
    return `Ends in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-5 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{competition.name}</h3>
            <div className="flex items-center mt-1 text-gray-500 text-sm">
              <Users className="h-4 w-4 mr-1" />
              {competition.organization?.name || "Organization"}
            </div>
          </div>
          <Badge className={`${competition.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {competition.isActive ? 'Active' : 'Closed'}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-600 mb-4 flex-grow">{competition.description}</p>
        
        <div className="space-y-2 border-t border-gray-200 pt-4 mt-auto">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 flex items-center">
              <Calendar className="h-4 w-4 mr-1" /> Start Date:
            </span>
            <span className="font-medium">{formatDate(competition.startDate)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 flex items-center">
              <Calendar className="h-4 w-4 mr-1" /> End Date:
            </span>
            <span className="font-medium">{formatDate(competition.endDate)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 flex items-center">
              <Award className="h-4 w-4 mr-1" /> Status:
            </span>
            <span className={`font-medium ${competition.isActive ? 'text-green-600' : 'text-gray-600'}`}>
              {competition.isActive ? getDaysRemaining(competition.endDate) : 'Closed'}
            </span>
          </div>
          
          {competition.photoCount !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Submissions:</span>
              <span className="font-medium">{competition.photoCount}</span>
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between">
          <Button asChild variant="outline" size="sm">
            <Link href={`/competitions/${competition.id}`}>
              View Competition
            </Link>
          </Button>
          
          {isAdminView && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/competitions/${competition.id}/edit`}>
                Manage
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
