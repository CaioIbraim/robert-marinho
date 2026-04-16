import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  setGlobalLoading: (loading) => set({ isLoading: loading }),
}));
