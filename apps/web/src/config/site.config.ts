export const siteConfig = {
  name: 'Joel Talargie Academy',
  shortName: 'JTA',
  tagline: 'Digital Construct',
  description: 'Learn with purpose. Build with confidence.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
} as const;
