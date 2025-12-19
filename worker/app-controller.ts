import { DurableObject } from 'cloudflare:workers';
import type { SessionInfo } from './types';
import type { Env } from './core-utils';
export interface UserSettings {
  accountId: string;
  email: string;
  apiKey: string;
  cloudflareContact: {
    name: string;
    role: string;
    email: string;
    team: string;
  };
  customerContact: {
    customerName: string;
    name: string;
    role: string;
    email: string;
  };
}
export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  status: 'Success' | 'Failed' | 'Warning';
  description?: string;
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
  aiInsights?: AIInsights;
}
export class AppController extends DurableObject<Env> {
  private sessions = new Map<string, SessionInfo>();
  private loaded = false;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }
  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      const stored = await this.ctx.storage.get<Record<string, SessionInfo>>('sessions') || {};
      this.sessions = new Map(Object.entries(stored));
      this.loaded = true;
    }
  }
  private async persistSessions(): Promise<void> {
    await this.ctx.storage.put('sessions', Object.fromEntries(this.sessions));
  }
  async getSettings(): Promise<UserSettings> {
    const defaultSettings: UserSettings = {
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
    const stored = await this.ctx.storage.get<UserSettings>('user_settings');
    if (!stored) return defaultSettings;
    return {
      ...defaultSettings,
      ...stored,
      cloudflareContact: { ...defaultSettings.cloudflareContact, ...stored.cloudflareContact },
      customerContact: { ...defaultSettings.customerContact, ...stored.customerContact },
    };
  }
  async updateSettings(settings: UserSettings): Promise<void> {
    await this.ctx.storage.put('user_settings', settings);
  }
  async addReport(report: AssessmentReport): Promise<void> {
    const reports = await this.ctx.storage.get<AssessmentReport[]>('reports') || [];
    reports.unshift(report);
    await this.ctx.storage.put('reports', reports.slice(0, 10));
  }
  async listReports(): Promise<AssessmentReport[]> {
    return await this.ctx.storage.get<AssessmentReport[]>('reports') || [];
  }
  async getReportById(id: string): Promise<AssessmentReport | null> {
    const reports = await this.ctx.storage.get<AssessmentReport[]>('reports') || [];
    return reports.find(r => r.id === id) || null;
  }
  async removeReport(id: string): Promise<boolean> {
    const reports = await this.ctx.storage.get<AssessmentReport[]>('reports') || [];
    const initialLength = reports.length;
    const filteredReports = reports.filter(r => r.id !== id);
    if (filteredReports.length < initialLength) {
      await this.ctx.storage.put('reports', filteredReports);
      return true;
    }
    return false;
  }
  async addLog(log: Omit<AuditLog, 'id'>): Promise<void> {
    const logs = await this.ctx.storage.get<AuditLog[]>('audit_logs') || [];
    const newLog: AuditLog = { ...log, id: crypto.randomUUID() };
    logs.unshift(newLog);
    await this.ctx.storage.put('audit_logs', logs.slice(0, 100));
  }
  async getLogs(): Promise<AuditLog[]> {
    return await this.ctx.storage.get<AuditLog[]>('audit_logs') || [];
  }
  async addSession(sessionId: string, title?: string): Promise<void> {
    await this.ensureLoaded();
    const now = Date.now();
    this.sessions.set(sessionId, {
      id: sessionId,
      title: title || `Chat ${new Date(now).toLocaleDateString()}`,
      createdAt: now,
      lastActive: now
    });
    await this.persistSessions();
  }
  async removeSession(sessionId: string): Promise<boolean> {
    await this.ensureLoaded();
    const deleted = this.sessions.delete(sessionId);
    if (deleted) await this.persistSessions();
    return deleted;
  }
  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.ensureLoaded();
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActive = Date.now();
      await this.persistSessions();
    }
  }
  async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    await this.ensureLoaded();
    const session = this.sessions.get(sessionId);
    if (session) {
      session.title = title;
      await this.persistSessions();
      return true;
    }
    return false;
  }
  async listSessions(): Promise<SessionInfo[]> {
    await this.ensureLoaded();
    return Array.from(this.sessions.values()).sort((a, b) => b.lastActive - a.lastActive);
  }
  async getSessionCount(): Promise<number> {
    await this.ensureLoaded();
    return this.sessions.size;
  }
  async getSession(sessionId: string): Promise<SessionInfo | null> {
    await this.ensureLoaded();
    return this.sessions.get(sessionId) || null;
  }
  async clearAllSessions(): Promise<number> {
    await this.ensureLoaded();
    const count = this.sessions.size;
    this.sessions.clear();
    await this.persistSessions();
    return count;
  }
}