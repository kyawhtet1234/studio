
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function StatCard({ title, value, icon: Icon, description, loading, className, style }: StatCardProps) {
  if (loading) {
    return <Skeleton className={cn("h-[126px]", className)} style={style} />;
  }
  
  return (
    <Card className={cn(className, "shadow-drop-shadow-black")} style={style}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
