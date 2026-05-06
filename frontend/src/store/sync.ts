import { create } from "zustand";

type SyncState = {
  syncing: boolean;
  lastSyncAt: string | null;
  setSyncing: (value: boolean) => void;
  setLastSyncAt: (value: string | null) => void;
};

export const useSyncStore = create<SyncState>((set) => ({
  syncing: false,
  lastSyncAt: null,
  setSyncing: (value) => set({ syncing: value }),
  setLastSyncAt: (value) => set({ lastSyncAt: value }),
}));
