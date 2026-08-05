import { create } from 'zustand';
import type { CourseAccessType, CourseDifficulty, CourseSort } from '@/features/catalog';

export interface CourseFilterState {
  search: string;
  categoryId: string | undefined;
  accessType: CourseAccessType | undefined;
  difficulty: CourseDifficulty | undefined;
  sort: CourseSort;
  page: number;
  pageSize: number;
  view: 'grid' | 'list';
  setSearch: (search: string) => void;
  setCategoryId: (categoryId: string | undefined) => void;
  setAccessType: (accessType: CourseAccessType | undefined) => void;
  setDifficulty: (difficulty: CourseDifficulty | undefined) => void;
  setSort: (sort: CourseSort) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setView: (view: 'grid' | 'list') => void;
  resetFilters: () => void;
}

const initialFilterState = {
  search: '',
  categoryId: undefined,
  accessType: undefined,
  difficulty: undefined,
  sort: 'newest' as CourseSort,
  page: 1,
  pageSize: 12,
  view: 'grid' as const,
};

export const useFilterStore = create<CourseFilterState>((set) => ({
  ...initialFilterState,
  setSearch: (search) => set({ search, page: 1 }),
  setCategoryId: (categoryId) => set({ categoryId, page: 1 }),
  setAccessType: (accessType) => set({ accessType, page: 1 }),
  setDifficulty: (difficulty) => set({ difficulty, page: 1 }),
  setSort: (sort) => set({ sort, page: 1 }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  setView: (view) => set({ view }),
  resetFilters: () => set(initialFilterState),
}));
