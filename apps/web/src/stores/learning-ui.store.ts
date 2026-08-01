import { create } from 'zustand';

interface LearningUiState {
  isCurriculumPanelOpen: boolean;
  openCurriculumPanel: () => void;
  closeCurriculumPanel: () => void;
  toggleCurriculumPanel: () => void;
}

export const useLearningUiStore = create<LearningUiState>((set) => ({
  isCurriculumPanelOpen: false,
  openCurriculumPanel: () => set({ isCurriculumPanelOpen: true }),
  closeCurriculumPanel: () => set({ isCurriculumPanelOpen: false }),
  toggleCurriculumPanel: () =>
    set((state) => ({ isCurriculumPanelOpen: !state.isCurriculumPanelOpen })),
}));
