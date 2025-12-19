import { Settings, DeepPartial } from './store';
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
  status: 'Success' | 'Failed' | 'Warning' | 'Error';
  description?: string;
  details?: string;
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
  usageTrends?: any[];
  statusTrends?: any[];
  dataTrends?: any[];
  mcpTrends?: any[];
  topAppsTrends?: Array<Record<string, any>>;
}
export interface AIRecommendation {
  title: string;
  description: string;
  type: 'critical' | 'policy' | 'optimization';
}
export interface AIInsights {
  summary: string;
  recommendations: AIRecommendation[];
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
  prompt?: string;
}
export interface AssessmentReportDebug {
  aiIds: string[];
  totalAI: number;
  managedIds: string[];
  managedCount: number;
  shadowUsage: number;
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
    dataExfiltrationKB: number;
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
  aiInsights?: AIInsights;
  debug?: AssessmentReportDebug;
}
async function safeApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const url = `/api${endpoint}`;
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    if (!res.ok) {
      let errorData;
      try {
        errorData = text ? JSON.parse(text) : { error: `Server error ${res.status}` };
      } catch {
        errorData = { error: `Server error ${res.status}`, detail: text.slice(0, 100) };
      }
      return { success: false, error: errorData.error, detail: errorData.detail } as ApiResponse<T>;
    }
    if (!text || text.trim().length === 0) return { success: true } as ApiResponse<T>;
    try {
      return JSON.parse(text) as ApiResponse<T>;
    } catch (e) {
      return {
        success: false,
        error: 'Malformed response received from server',
        detail: 'The backend returned a non-JSON payload.'
      } as ApiResponse<T>;
    }
  } catch (error: any) {
    return { success: false, error: 'Network connection failed' } as ApiResponse<T>;
  }
}
export const api = {
  getSettings: () => safeApi<Settings>('/settings'),
  updateSettings: (settings: DeepPartial<Settings>) => safeApi<void>('/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  }),
  checkLicense: () => safeApi<LicenseInfo>('/license-check', { method: 'POST' }),
  listReports: () => safeApi<AssessmentReport[]>('/reports'),
  getReport: (id: string) => safeApi<AssessmentReport>(`/reports/${id}`),
  deleteReport: (id: string) => safeApi<void>(`/reports/${id}`, { method: 'DELETE' }),
  startAssessment: () => safeApi<AssessmentReport>('/assess', { method: 'POST' }),
  getLogs: () => safeApi<AuditLog[]>('/logs'),
  getAiTrends: () => safeApi<{ topAppsTrends: Array<Record<string, any>> }>('/ai-trends'),
};