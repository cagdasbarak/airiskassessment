import { Settings } from './store';
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
export const api = {
  async getSettings(): Promise<ApiResponse<Settings>> {
    const res = await fetch('/api/settings');
    return res.json();
  },
  async updateSettings(settings: Settings): Promise<ApiResponse<void>> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },
  async listReports(): Promise<ApiResponse<any[]>> {
    const res = await fetch('/api/reports');
    return res.json();
  },
  async getReport(id: string): Promise<ApiResponse<any>> {
    const res = await fetch(`/api/reports/${id}`);
    return res.json();
  },
  async startAssessment(): Promise<ApiResponse<any>> {
    const res = await fetch('/api/assess', { method: 'POST' });
    return res.json();
  },
};