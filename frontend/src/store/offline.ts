import { create } from "zustand";

type OfflineState = {
  queued: number;
  setQueued: (value: number) => void;
};

export const useOfflineStore = create<OfflineState>((set) => ({
  queued: 0,
  setQueued: (value) => set({ queued: value }),
}));
