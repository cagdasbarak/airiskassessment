import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export interface CloudflareContact {
  name: string;
  role: string;
  email: string;
  team: string;
}
export interface CustomerContact {
  customerName: string;
  name: string;
  role: string;
  email: string;
}
export interface Settings {
  accountId: string;
  email: string;
  apiKey: string;
  cloudflareContact: CloudflareContact;
  customerContact: CustomerContact;
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
        cloudflareContact: {
          name: 'Cloudflare Admin',
          role: 'Solutions Engineer',
          email: 'se@cloudflare.com',
          team: 'Security Specialist',
        },
        customerContact: {
          customerName: 'Enterprise Corp',
          name: 'Security Director',
          role: 'CISO',
          email: 'ciso@enterprise.com',
        },
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