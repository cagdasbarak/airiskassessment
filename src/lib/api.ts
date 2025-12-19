import { Settings } from './store';
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  detail?: string;
}
export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  status: 'Success' | 'Failed' | 'Warning';
  description?: string;
}
export interface LicenseInfo {
  plan: string;
  totalLicenses: number;
  usedLicenses: number;
  accessSub: boolean;
  gatewaySub: boolean;
  dlp: boolean;
  casb: boolean;
  rbi: boolean;
}
export interface PowerUser {
  email: string;
  name: string;
  prompts: number;
}
export interface SecurityCharts {
  usageOverTime?: Array<{ name: string; usage: number }>;
  riskDistribution?: Array<{ name: string; value: number }>;
}
export interface AssessmentReport {
  id: string;
  date: string;
  status: 'Completed' | 'Failed' | 'Processing';
  score: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  summary: {
    totalApps: number;
    aiApps: number;
    shadowAiApps: number;
    shadowUsage: number;
    unapprovedApps: number;
    dataExfiltrationRisk: string;
    complianceScore: number;
    libraryCoverage: number;
    casbPosture: number;
  };
  powerUsers: PowerUser[];
  appLibrary: Array<{
    appId: string;
    name: string;
    category: string;
    status: 'Approved' | 'Unapproved' | 'Review' | 'Unreviewed';
    users: number;
    risk: string;
    risk_score: number;
    genai_score: number;
    policies: any[];
    usage: any[];
  }>;
  securityCharts: SecurityCharts;
}
async function safeApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const url = `/api${endpoint}`;
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    if (!res.ok) {
      console.warn(`[API DIAGNOSTIC] ${options?.method || 'GET'} ${endpoint} failed with status ${res.status}`);
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { error: `Server error ${res.status}`, detail: text.slice(0, 100) };
      }
      return { success: false, error: errorData.error, detail: errorData.detail } as ApiResponse<T>;
    }
    if (!text || text.trim().length === 0) {
      return { success: true } as ApiResponse<T>;
    }
    try {
      return JSON.parse(text) as ApiResponse<T>;
    } catch (e: any) {
      console.error(`[API DIAGNOSTIC] JSON parsing failed for ${endpoint}:`, text.slice(0, 100));
      return { success: false, error: 'Invalid server response' } as ApiResponse<T>;
    }
  } catch (error: any) {
    console.error(`[API DIAGNOSTIC] Network failure for ${endpoint}:`, error.message);
    return { success: false, error: 'Network connection failed' } as ApiResponse<T>;
  }
}
export const api = {
  async getSettings(): Promise<ApiResponse<Settings>> {
    return safeApi<Settings>('/settings');
  },
  async updateSettings(settings: Settings): Promise<ApiResponse<void>> {
    return safeApi<void>('/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  },
  async checkLicense(): Promise<ApiResponse<LicenseInfo>> {
    return safeApi<LicenseInfo>('/license-check', { method: 'POST' });
  },
  async listReports(): Promise<ApiResponse<AssessmentReport[]>> {
    return safeApi<AssessmentReport[]>('/reports');
  },
  async getReport(id: string): Promise<ApiResponse<AssessmentReport>> {
    return safeApi<AssessmentReport>(`/reports/${id}`);
  },
  async deleteReport(id: string): Promise<ApiResponse<void>> {
    return safeApi<void>(`/reports/${id}`, {
      method: 'DELETE',
    });
  },
  async startAssessment(): Promise<ApiResponse<AssessmentReport>> {
    return safeApi<AssessmentReport>('/assess', { method: 'POST' });
  },
  async getLogs(): Promise<ApiResponse<AuditLog[]>> {
    return safeApi<AuditLog[]>('/logs');
  },
};