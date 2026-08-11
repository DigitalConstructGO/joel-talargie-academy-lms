import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

export interface ChartCardProps {
  title: string;
  description?: string;
  config: ChartConfig;
  children: React.ComponentProps<typeof ChartContainer>['children'];
  className?: string;
}

export function ChartCard({ title, description, config, children, className }: ChartCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="max-h-80 w-full">
          {children}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
