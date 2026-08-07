/**
 * Mock-mode-only placeholder media: the real backend serves an actual
 * per-lesson `videoUrl`/`content`, which the mock catalog data doesn't
 * carry (it only has lesson metadata for the curriculum preview). A single
 * widely-used public-domain sample video stands in for every VIDEO lesson
 * here - clearly a demo fixture, never used when `NEXT_PUBLIC_CATALOG_DATA_SOURCE=live`.
 */
export const MOCK_LESSON_VIDEO_URL =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export function mockLessonTextContent(title: string): string {
  return `<p>This is a placeholder lesson overview for <strong>${title}</strong>. In live mode this content comes from the instructor-authored lesson text stored on the backend.</p><p>Use the curriculum on the left to move between lessons, and mark this lesson complete once you're done to update your course progress.</p>`;
}
