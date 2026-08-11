import type { BlogPost } from '../types/blog.types';

/** Demo content only - no blog/CMS backend exists yet. */
export const MOCK_POSTS: BlogPost[] = [
  {
    id: 'post-01',
    slug: 'top-programming-languages-2026',
    title: 'Top Programming Languages to Learn in 2026',
    excerpt:
      'From TypeScript to Rust, here is what is actually in demand this year and why - based on job postings, not hype.',
    category: 'Career',
    readMinutes: 7,
    publishedAt: '2026-06-12',
    author: 'Sarah Mitchell',
  },
  {
    id: 'post-02',
    slug: 'how-to-become-a-backend-engineer',
    title: 'How to Become a Backend Engineer: A Practical Roadmap',
    excerpt:
      'The skills that actually matter for backend roles, in the order you should learn them, without wasting time on the wrong things first.',
    category: 'Career',
    readMinutes: 9,
    publishedAt: '2026-05-28',
    author: 'David Chen',
  },
  {
    id: 'post-03',
    slug: 'learning-postgresql-the-right-way',
    title: 'Learning PostgreSQL the Right Way',
    excerpt:
      'Most tutorials teach you SELECT statements and stop. Here is what to actually learn if you want to use PostgreSQL professionally.',
    category: 'Databases',
    readMinutes: 6,
    publishedAt: '2026-05-14',
    author: 'Robert Wallace',
  },
  {
    id: 'post-04',
    slug: 'building-rest-apis-that-scale',
    title: 'Building REST APIs That Actually Scale',
    excerpt:
      'Pagination, caching, and versioning strategies that separate a hobby API from one that can handle real production traffic.',
    category: 'Engineering',
    readMinutes: 8,
    publishedAt: '2026-04-30',
    author: 'David Chen',
  },
  {
    id: 'post-05',
    slug: 'cybersecurity-tips-every-developer-needs',
    title: 'Cybersecurity Tips Every Developer Needs to Know',
    excerpt:
      'You do not need to be a security specialist to avoid the most common vulnerabilities. Start with these fundamentals.',
    category: 'Security',
    readMinutes: 6,
    publishedAt: '2026-04-09',
    author: 'Marcus Johnson',
  },
  {
    id: 'post-06',
    slug: 'career-advice-for-junior-developers',
    title: 'Career Advice for Junior Developers in Their First Year',
    excerpt:
      'What actually helps early in your career - and what advice you can safely ignore - from engineers who have hired and mentored juniors.',
    category: 'Career',
    readMinutes: 5,
    publishedAt: '2026-03-22',
    author: 'Amara Okafor',
  },
];
