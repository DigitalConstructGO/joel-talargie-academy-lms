import { BlogCard } from './blog-card';
import { MOCK_POSTS } from '../data/mock-posts.data';

export function BlogPreviewSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Latest from the blog
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Career advice, technical deep dives, and industry insights.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_POSTS.slice(0, 3).map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
