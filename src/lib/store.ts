import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export interface Settings {
  accountId: string;
  email: string;
  apiKey: string;
  contactName: string;
  contactEmail: string;
}
interface AppState {
  isAuthenticated: boolean;
  settings: Settings;
  setAuthenticated: (val: boolean) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  logout: () => void;
}
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      settings: {
        accountId: '',
        email: '',
        apiKey: '',
        contactName: 'Security Admin',
        contactEmail: 'admin@company.com',
      },
      setAuthenticated: (val) => set({ isAuthenticated: val }),
      updateSettings: (newSettings) =>
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      logout: () => set({ isAuthenticated: false }),
    }),
    {
      name: 'riskguard-storage',
    }
  )
);