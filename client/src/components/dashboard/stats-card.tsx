import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
}

export function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  return (
    <Card className={`border-l-4 ${color}`}>
      <div className="flex justify-between items-center p-5">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <div className={`${getBackgroundColor(color)} p-3 rounded-full`}>
          <Icon className={`${getIconColor(color)}`} />
        </div>
      </div>
    </Card>
  );
}

// Helper functions to determine background and icon colors
function getBackgroundColor(color: string): string {
  switch (color) {
    case "border-primary":
      return "bg-blue-100";
    case "border-secondary":
      return "bg-green-100";
    case "border-accent":
      return "bg-amber-100";
    case "border-purple-500":
      return "bg-purple-100";
    default:
      return "bg-gray-100";
  }
}

function getIconColor(color: string): string {
  switch (color) {
    case "border-primary":
      return "text-primary";
    case "border-secondary":
      return "text-secondary";
    case "border-accent":
      return "text-accent";
    case "border-purple-500":
      return "text-purple-500";
    default:
      return "text-gray-500";
  }
}
