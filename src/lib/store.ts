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
  username: string | null;
  settings: Settings;
  setAuthenticated: (val: boolean, username: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  logout: () => void;
}
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      username: null,
      settings: {
        accountId: '',
        email: '',
        apiKey: '',
        contactName: 'Security Admin',
        contactEmail: 'admin@company.com',
      },
      setAuthenticated: (val, username) => set({ isAuthenticated: val, username }),
      updateSettings: (newSettings) =>
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      logout: () => set({ isAuthenticated: false, username: null }),
    }),
    {
      name: 'riskguard-storage',
    }
  )
);