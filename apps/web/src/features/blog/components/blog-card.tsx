import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date';
import type { BlogPost } from '../types/blog.types';

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex aspect-[16/9] items-center justify-center bg-linear-to-br from-brand/15 via-muted to-muted">
        <Badge variant="secondary">{post.category}</Badge>
      </div>
      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{post.title}</h3>
        <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">{post.excerpt}</p>
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <span>{post.author}</span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {post.readMinutes} min read
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{formatDate(post.publishedAt)}</p>
      </CardContent>
    </Card>
  );
}
