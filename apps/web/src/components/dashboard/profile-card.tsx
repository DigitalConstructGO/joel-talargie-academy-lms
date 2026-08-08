import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ProfileCardStat {
  label: string;
  value: React.ReactNode;
}

export interface ProfileCardProps {
  name: string;
  role: string;
  avatarUrl?: string | null;
  stats?: ProfileCardStat[];
  actions?: React.ReactNode;
  className?: string;
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** A profile summary tile - avatar, name, role, optional stat row and actions. */
export function ProfileCard({
  name,
  role,
  avatarUrl,
  stats,
  actions,
  className,
}: ProfileCardProps) {
  return (
    <Card className={cn('flex flex-col items-center gap-3 p-6 text-center', className)}>
      <Avatar className="size-16">
        <AvatarImage src={avatarUrl ?? undefined} alt="" />
        <AvatarFallback className="text-lg">{initialsOf(name)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <Badge variant="secondary" className="mt-1">
          {role}
        </Badge>
      </div>
      {stats && stats.length > 0 && (
        <div className="mt-1 flex w-full items-center justify-center divide-x divide-border">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-1 flex-col px-3">
              <span className="text-base font-semibold text-foreground">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      )}
      {actions && (
        <div className="mt-2 flex w-full items-center justify-center gap-2">{actions}</div>
      )}
    </Card>
  );
}
