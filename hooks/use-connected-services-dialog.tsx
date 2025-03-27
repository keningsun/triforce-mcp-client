import { create } from "zustand";

interface ConnectedServicesDialogStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const useConnectedServicesDialog = create<ConnectedServicesDialogStore>(
  (set) => ({
    isOpen: false,
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
  })
);
