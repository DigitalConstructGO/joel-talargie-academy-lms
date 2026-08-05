import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistState {
  courseIds: string[];
  isWishlisted: (courseId: string) => boolean;
  toggleWishlist: (courseId: string) => void;
  removeFromWishlist: (courseId: string) => void;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      courseIds: [],
      isWishlisted: (courseId) => get().courseIds.includes(courseId),
      toggleWishlist: (courseId) =>
        set((state) => ({
          courseIds: state.courseIds.includes(courseId)
            ? state.courseIds.filter((id) => id !== courseId)
            : [...state.courseIds, courseId],
        })),
      removeFromWishlist: (courseId) =>
        set((state) => ({ courseIds: state.courseIds.filter((id) => id !== courseId) })),
      clearWishlist: () => set({ courseIds: [] }),
    }),
    { name: 'joel-academy-wishlist' },
  ),
);
