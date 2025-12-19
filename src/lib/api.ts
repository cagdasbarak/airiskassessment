import { Settings } from './store';
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  status: 'Success' | 'Failed' | 'Warning';
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
  events: number;
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
  securityCharts: {
    usageOverTime: Array<{ name: string; usage: number }>;
    riskDistribution: Array<{ name: string; value: number }>;
    dataVolume: Array<{ name: string; value: number }>;
    mcpActivity: Array<{ name: string; value: number }>;
    loginEvents: Array<{ name: string; value: number }>;
  };
  aiInsights?: {
    summary: string;
    recommendations: Array<{
      title: string;
      description: string;
      type: 'critical' | 'policy' | 'optimization';
    }>;
  };
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
  async checkLicense(): Promise<ApiResponse<LicenseInfo>> {
    const res = await fetch('/api/license-check', { method: 'POST' });
    return res.json();
  },
  async listReports(): Promise<ApiResponse<AssessmentReport[]>> {
    const res = await fetch('/api/reports');
    return res.json();
  },
  async getReport(id: string): Promise<ApiResponse<AssessmentReport>> {
    const res = await fetch(`/api/reports/${id}`);
    return res.json();
  },
  async deleteReport(id: string): Promise<ApiResponse<void>> {
    const res = await fetch(`/api/reports/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },
  async startAssessment(): Promise<ApiResponse<AssessmentReport>> {
    const res = await fetch('/api/assess', { method: 'POST' });
    return res.json();
  },
  async getLogs(): Promise<ApiResponse<AuditLog[]>> {
    const res = await fetch('/api/logs');
    return res.json();
  },
};