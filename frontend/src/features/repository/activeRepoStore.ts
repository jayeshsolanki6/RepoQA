import { create } from 'zustand';
import type { Repository } from '@/types/api';

interface ActiveRepoState {
  activeRepo: Repository | null;
  setActiveRepo: (repo: Repository | null) => void;
}

export const useActiveRepoStore = create<ActiveRepoState>((set) => ({
  activeRepo: null,
  setActiveRepo: (activeRepo) => set({ activeRepo }),
}));
