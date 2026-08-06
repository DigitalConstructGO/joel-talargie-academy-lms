import type { MetadataRoute } from 'next';
import { ROUTES } from '@/constants/routes';
import { siteConfig } from '@/config/site.config';
import { catalogApi } from '@/features/catalog/api/catalog.api';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { MOCK_INSTRUCTORS } from '@/features/instructors/data/mock-instructors.data';
import { deriveInstructors } from '@/features/instructors/utils/derive-instructors';

const STATIC_PATHS = [
  ROUTES.home,
  ROUTES.about,
  ROUTES.pricing,
  ROUTES.contact,
  ROUTES.faq,
  ROUTES.helpCenter,
  ROUTES.privacyPolicy,
  ROUTES.terms,
  ROUTES.cookiePolicy,
  ROUTES.courses.list,
  ROUTES.categories.list,
  ROUTES.instructors.list,
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => `${siteConfig.url}${path}`;
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: url(path),
    changeFrequency: path === ROUTES.home ? 'daily' : 'weekly',
    priority: path === ROUTES.home ? 1 : 0.6,
  }));

  try {
    const [coursesResult, categoriesResult] = await Promise.all([
      catalogApi.listCourses({ pageSize: 200 }),
      catalogApi.listCategories({ pageSize: 100 }),
    ]);

    const courseEntries: MetadataRoute.Sitemap = coursesResult.items.map((course) => ({
      url: url(ROUTES.courses.detail(course.slug)),
      lastModified: course.publishedAt ?? undefined,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const categoryEntries: MetadataRoute.Sitemap = categoriesResult.items.map((category) => ({
      url: url(ROUTES.categories.detail(category.slug)),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    const instructorSlugs =
      CATALOG_DATA_SOURCE === 'mock'
        ? MOCK_INSTRUCTORS.map((instructor) => instructor.slug)
        : deriveInstructors(coursesResult.items).map((instructor) =>
            encodeURIComponent(instructor.name),
          );

    const instructorEntries: MetadataRoute.Sitemap = instructorSlugs.map((slug) => ({
      url: url(ROUTES.instructors.detail(slug)),
      changeFrequency: 'monthly',
      priority: 0.5,
    }));

    return [...staticEntries, ...courseEntries, ...categoryEntries, ...instructorEntries];
  } catch {
    return staticEntries;
  }
}
