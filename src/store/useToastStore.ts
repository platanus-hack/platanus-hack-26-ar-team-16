import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'streak';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  show: (type: ToastType, message: string, durationMs?: number) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (type, message, durationMs = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => get().dismiss(id), durationMs);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message: string, durationMs?: number) =>
    useToastStore.getState().show('success', message, durationMs),
  error: (message: string, durationMs?: number) =>
    useToastStore.getState().show('error', message, durationMs),
  info: (message: string, durationMs?: number) =>
    useToastStore.getState().show('info', message, durationMs),
  warning: (message: string, durationMs?: number) =>
    useToastStore.getState().show('warning', message, durationMs),
  streak: (message: string, durationMs?: number) =>
    useToastStore.getState().show('streak', message, durationMs),
};
