import type { Category } from '../types/catalog.types';

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat-web-development',
    name: 'Web Development',
    slug: 'web-development',
    description: 'Build modern, production-grade websites and web applications from the ground up.',
  },
  {
    id: 'cat-mobile-development',
    name: 'Mobile Development',
    slug: 'mobile-development',
    description: 'Design and ship native and cross-platform apps for iOS and Android.',
  },
  {
    id: 'cat-data-science',
    name: 'Data Science & Analytics',
    slug: 'data-science',
    description: 'Turn raw data into insight with Python, statistics, and visualization tools.',
  },
  {
    id: 'cat-artificial-intelligence',
    name: 'Artificial Intelligence & Machine Learning',
    slug: 'artificial-intelligence',
    description: 'Learn to build and deploy machine learning and deep learning models.',
  },
  {
    id: 'cat-cloud-computing',
    name: 'Cloud Computing',
    slug: 'cloud-computing',
    description: 'Design and deploy scalable infrastructure on AWS, Azure, and Google Cloud.',
  },
  {
    id: 'cat-devops',
    name: 'DevOps & Infrastructure',
    slug: 'devops',
    description:
      'Automate delivery pipelines and manage infrastructure like a production engineer.',
  },
  {
    id: 'cat-cybersecurity',
    name: 'Cybersecurity',
    slug: 'cybersecurity',
    description: 'Protect systems and data with hands-on security and ethical hacking skills.',
  },
  {
    id: 'cat-ui-ux-design',
    name: 'UI/UX Design',
    slug: 'ui-ux-design',
    description: 'Design usable, beautiful digital products backed by real user research.',
  },
  {
    id: 'cat-programming-languages',
    name: 'Programming Languages',
    slug: 'programming-languages',
    description: 'Master the languages powering modern software, from Python to Rust.',
  },
  {
    id: 'cat-database-systems',
    name: 'Database Systems',
    slug: 'database-systems',
    description: 'Design, query, and optimize relational databases for real applications.',
  },
  {
    id: 'cat-business-management',
    name: 'Business & Management',
    slug: 'business-management',
    description: 'Build the analysis, leadership, and communication skills businesses need.',
  },
  {
    id: 'cat-digital-marketing',
    name: 'Digital Marketing',
    slug: 'digital-marketing',
    description: 'Grow audiences and revenue with SEO, content, and paid acquisition strategy.',
  },
  {
    id: 'cat-graphic-design',
    name: 'Graphic Design',
    slug: 'graphic-design',
    description: 'Create compelling visual and brand design work with industry-standard tools.',
  },
  {
    id: 'cat-project-management',
    name: 'Project Management',
    slug: 'project-management',
    description: 'Deliver projects on time and on budget with proven PM and Agile frameworks.',
  },
  {
    id: 'cat-software-testing',
    name: 'Software Testing & QA',
    slug: 'software-testing',
    description: 'Build automated test suites that catch bugs before customers do.',
  },
];

export function getMockCategoryBySlug(slug: string): Category | undefined {
  return MOCK_CATEGORIES.find((category) => category.slug === slug);
}
