"use client";

import { create } from "zustand";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning";
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

let toastCounter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    const duration = toast.duration ?? 5000;

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),
}));

export function useToast() {
  const { addToast, removeToast, clearToasts, toasts } = useToastStore();

  return {
    toasts,
    toast: addToast,
    dismiss: removeToast,
    clearAll: clearToasts,
  };
}

/** Standalone toast function (for use outside React components / hooks) */
export function toast(opts: Omit<Toast, "id">) {
  useToastStore.getState().addToast(opts);
}
