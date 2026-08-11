import { create } from 'zustand';

/**
 * Search/category/access/difficulty/sort/page now live in the URL via
 * `useQueryFilters` (see `CourseFilters`/`CoursesGrid`) so they survive
 * refresh, back/forward, and are shareable. Grid/list view is presentation
 * preference, not filter state worth persisting in the URL, so it stays
 * here as lightweight shared client state.
 */
export interface CourseFilterState {
  view: 'grid' | 'list';
  setView: (view: 'grid' | 'list') => void;
}

export const useFilterStore = create<CourseFilterState>((set) => ({
  view: 'grid',
  setView: (view) => set({ view }),
}));
