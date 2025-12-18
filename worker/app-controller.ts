import { DurableObject } from 'cloudflare:workers';
import type { SessionInfo } from './types';
import type { Env } from './core-utils';
export interface UserSettings {
  accountId: string;
  email: string;
  apiKey: string;
  contactName: string;
  contactEmail: string;
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
  };
  appLibrary: Array<{
    name: string;
    category: string;
    status: string;
    users: number;
    risk: string;
  }>;
  securityCharts: {
    usageOverTime: Array<{ name: string; usage: number }>;
    riskDistribution: Array<{ name: string; value: number }>;
  };
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
  // Settings Management
  async getSettings(): Promise<UserSettings> {
    const defaultSettings: UserSettings = {
      accountId: '',
      email: '',
      apiKey: '',
      contactName: 'Security Admin',
      contactEmail: 'admin@company.com',
    };
    return await this.ctx.storage.get<UserSettings>('user_settings') || defaultSettings;
  }
  async updateSettings(settings: UserSettings): Promise<void> {
    await this.ctx.storage.put('user_settings', settings);
  }
  // Report Management
  async addReport(report: AssessmentReport): Promise<void> {
    const reports = await this.ctx.storage.get<AssessmentReport[]>('reports') || [];
    reports.unshift(report);
    // Keep only last 50 reports
    await this.ctx.storage.put('reports', reports.slice(0, 50));
  }
  async listReports(): Promise<AssessmentReport[]> {
    return await this.ctx.storage.get<AssessmentReport[]>('reports') || [];
  }
  async getReportById(id: string): Promise<AssessmentReport | null> {
    const reports = await this.ctx.storage.get<AssessmentReport[]>('reports') || [];
    return reports.find(r => r.id === id) || null;
  }
  // Original Session Methods
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