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
export interface AppPolicy {
  name: string;
  action: string;
  type: 'Gateway' | 'Access';
}
export interface AppUsageEvent {
  clientIP: string;
  userEmail: string;
  action: string;
  date: string;
  bytesKB: number;
}
export interface PowerUser {
  email: string;
  name: string;
  prompts: number;
}
export interface SecurityCharts {
  usageOverTime?: Array<{ name: string; usage: number }>;
  riskDistribution?: Array<{ name: string; value: number }>;
  topAppsTrend?: Array<Record<string, any>>;
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
    policies: AppPolicy[];
    usage: AppUsageEvent[];
  }>;
  securityCharts: SecurityCharts;
  aiInsights?: {
    summary: string;
    recommendations: Array<{
      title: string;
      description: string;
      type: 'critical' | 'policy' | 'optimization';
    }>;
  };
}
async function safeApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const url = `/api${endpoint}`;
  console.info(`[API CALL] Starting ${options?.method || 'GET'} to ${endpoint}`);
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    if (!res.ok) {
      console.error(`[API ERROR] Endpoint ${endpoint} returned ${res.status}:`, text.slice(0, 300));
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { error: `Server error ${res.status}`, detail: text.slice(0, 100) };
      }
      return { success: false, error: errorData.error, detail: errorData.detail } as ApiResponse<T>;
    }
    try {
      return JSON.parse(text) as ApiResponse<T>;
    } catch (e: any) {
      console.error(`[API ERROR] Failed to parse JSON from ${endpoint}:`, text.slice(0, 300));
      return { success: false, error: 'Invalid JSON from server' } as ApiResponse<T>;
    }
  } catch (error: any) {
    console.error(`[API ERROR] Network failure reaching ${endpoint}:`, error);
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