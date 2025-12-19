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
  status: 'Success' | 'Failed' | 'Warning' | 'Error';
  description?: string;
  details?: string;
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
    try {
      return (await this.ctx.storage.get<UserSettings>('user_settings')) || defaultSettings;
    } catch (err) {
      console.error("[AppController] Storage read error (settings):", err);
      return defaultSettings;
    }
  }
  async updateSettings(settings: UserSettings): Promise<void> {
    await this.ctx.storage.put('user_settings', settings);
  }
  async addReport(report: any): Promise<void> {
    try {
      const reports = await this.ctx.storage.get<any[]>('reports') || [];
      reports.unshift(report);
      // Keep only last 20 reports to stay under 128KB limit if needed
      await this.ctx.storage.put('reports', reports.slice(0, 20));
    } catch (err) {
      console.error("[AppController] Storage error (addReport):", err);
    }
  }
  async listReports(): Promise<any[]> {
    return await this.ctx.storage.get<any[]>('reports') || [];
  }
  async getReportById(id: string): Promise<any | null> {
    const reports = await this.listReports();
    return reports.find(r => r.id === id) || null;
  }
  async removeReport(id: string): Promise<void> {
    const reports = await this.listReports();
    const filtered = reports.filter(r => r.id !== id);
    await this.ctx.storage.put('reports', filtered);
  }
  async addLog(log: Omit<AuditLog, 'id'>): Promise<void> {
    try {
      const logs = await this.ctx.storage.get<AuditLog[]>('audit_logs') || [];
      const newLog: AuditLog = { ...log, id: crypto.randomUUID() };
      logs.unshift(newLog);
      await this.ctx.storage.put('audit_logs', logs.slice(0, 100));
    } catch (err) {
      console.error("[AppController] Storage error (addLog):", err);
    }
  }
  async getLogs(): Promise<AuditLog[]> {
    return await this.ctx.storage.get<AuditLog[]>('audit_logs') || [];
  }
  // Session Management for Chat Persistence
  async addSession(sessionId: string, title?: string): Promise<void> {
    await this.ensureLoaded();
    const now = Date.now();
    this.sessions.set(sessionId, {
      id: sessionId,
      title: title || `Chat ${new Date().toLocaleDateString()}`,
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
  async listSessions(): Promise<SessionInfo[]> {
    await this.ensureLoaded();
    return Array.from(this.sessions.values()).sort((a, b) => b.lastActive - a.lastActive);
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
  async clearAllSessions(): Promise<number> {
    await this.ensureLoaded();
    const count = this.sessions.size;
    this.sessions.clear();
    await this.persistSessions();
    return count;
  }
}