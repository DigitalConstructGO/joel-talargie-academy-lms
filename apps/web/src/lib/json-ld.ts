import { ROUTES } from '@/constants/routes';
import { siteConfig } from '@/config/site.config';

const absoluteUrl = (path: string) => `${siteConfig.url}${path}`;

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
  };
}

export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl(ROUTES.courses.list)}?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export interface BreadcrumbJsonLdItem {
  label: string;
  href?: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbJsonLdItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };
}

export interface ItemListJsonLdEntry {
  name: string;
  url: string;
}

export function buildItemListJsonLd(items: ItemListJsonLdEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.url),
    })),
  };
}
