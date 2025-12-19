import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { produce } from 'immer';
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
const DEFAULT_SETTINGS: Settings = {
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
};
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      username: null,
      settings: DEFAULT_SETTINGS,
      setAuthenticated: (val, username) => set({ isAuthenticated: val, username }),
      updateSettings: (newSettings) =>
        set(
          produce((state: AppState) => {
            if (newSettings.accountId !== undefined) state.settings.accountId = newSettings.accountId;
            if (newSettings.email !== undefined) state.settings.email = newSettings.email;
            if (newSettings.apiKey !== undefined) state.settings.apiKey = newSettings.apiKey;
            if (newSettings.cloudflareContact) {
              state.settings.cloudflareContact = {
                ...state.settings.cloudflareContact,
                ...newSettings.cloudflareContact,
              };
            }
            if (newSettings.customerContact) {
              state.settings.customerContact = {
                ...state.settings.customerContact,
                ...newSettings.customerContact,
              };
            }
          })
        ),
      logout: () => set({ isAuthenticated: false, username: null, settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'riskguard-storage',
    }
  )
);