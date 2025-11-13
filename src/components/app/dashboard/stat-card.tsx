
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Calendar } from "lucide-react";

type ChangeProps = {
    value: number;
    label: string;
};

type StatCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  dailyChange?: ChangeProps;
  monthlyChange?: ChangeProps;
};

const ChangeIndicator = ({ change, className }: { change: ChangeProps, className?: string }) => {
    const isPositive = change.value >= 0;
    return (
        <div className={cn("flex items-center text-xs", isPositive ? 'text-green-600' : 'text-red-600', className)}>
            {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {change.value.toFixed(1)}% {change.label}
        </div>
    );
};

export function StatCard({ title, value, icon: Icon, description, loading, className, style, dailyChange, monthlyChange }: StatCardProps) {
  if (loading) {
    return <Skeleton className={cn("h-[126px]", className)} style={style} />;
  }
  
  return (
    <Card className={cn(className, "shadow-drop-shadow-black flex flex-col justify-between")} style={style}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {(dailyChange || monthlyChange) && (
            <div className="mt-2 space-y-1">
                {dailyChange && <ChangeIndicator change={dailyChange} />}
                {monthlyChange && <ChangeIndicator change={monthlyChange} className="text-yellow-600" />}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
