import { Calendar, Clock, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface UpcomingClassCardProps {
  instructorName: string;
  instructorTitle: string;
  instructorAvatarUrl?: string;
  classTitle: string;
  date: string;
  time: string;
  onSetReminder?: () => void;
  className?: string;
}

/** Sidebar widget for the next scheduled live class - instructor, schedule, and a reminder CTA. */
export function UpcomingClassCard({
  instructorName,
  instructorTitle,
  instructorAvatarUrl,
  classTitle,
  date,
  time,
  onSetReminder,
  className,
}: UpcomingClassCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <h3 className="font-semibold text-foreground">Upcoming Live Class</h3>
        <span
          className="size-2.5 shrink-0 animate-pulse rounded-full bg-destructive"
          aria-hidden="true"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-11 border border-border">
            <AvatarImage src={instructorAvatarUrl} alt="" />
            <AvatarFallback>{instructorName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-none text-foreground">
              {instructorName}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{instructorTitle}</p>
          </div>
        </div>
        <h4 className="font-semibold leading-tight text-foreground">{classTitle}</h4>
        <div className="space-y-2 rounded-xl bg-muted/60 p-4">
          <div className="flex items-center gap-3 text-sm font-medium text-foreground">
            <Calendar className="size-4 text-primary" />
            {date}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Clock className="size-4" />
            {time}
          </div>
        </div>
        <Button
          onClick={onSetReminder}
          className="w-full gap-2 bg-sidebar text-sidebar-foreground hover:bg-sidebar/90"
        >
          <Video className="size-4" />
          Set Reminder
        </Button>
      </CardContent>
    </Card>
  );
}
