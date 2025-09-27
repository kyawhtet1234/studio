import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  children?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4", className)}>
      <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">
        {title}
      </h1>
      {children && <div className="flex w-full md:w-auto items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}
