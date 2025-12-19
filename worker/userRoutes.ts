import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { Env, getAppController, registerSession } from "./core-utils";
import type { AssessmentReport, PowerUser, AppPolicy } from './app-controller';
let coreRoutesRegistered = false;
let userRoutesRegistered = false;
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
  if (coreRoutesRegistered) return;
  coreRoutesRegistered = true;
  app.all('/api/chat/:sessionId/*', async (c) => {
    try {
      const sessionId = c.req.param('sessionId');
      const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, sessionId);
      const url = new URL(c.req.url);
      url.pathname = url.pathname.replace(`/api/chat/${sessionId}`, '');
      return agent.fetch(new Request(url.toString(), {
        method: c.req.method,
        headers: c.req.header(),
        body: c.req.method === 'GET' || c.req.method === 'DELETE' ? undefined : c.req.raw.body
      }));
    } catch (error) {
      console.error('Agent routing error:', error);
      return c.json({ success: false, error: 'Agent routing failed' }, { status: 500 });
    }
  });
}
const generate30DayTrend = (baseValue: number, variance: number) => {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toISOString().split('T')[0],
      value: Math.max(0, baseValue + (Math.random() * variance - variance / 2))
    });
  }
  return data;
};
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  if (userRoutesRegistered) return;
  userRoutesRegistered = true;
  const getCFHeaders = (email: string, key: string) => ({
    'X-Auth-Email': email ?? '',
    'X-Auth-Key': key ?? '',
    'Content-Type': 'application/json'
  });
  const safeCFJson = async (resp: Response): Promise<any> => {
    try {
      const text = await resp.text().catch(() => '');
      if (!resp.ok) return { success: false, result: [], errors: [{ message: `HTTP ${resp.status}` }] };
      return JSON.parse(text || '{}');
    } catch (e) {
      return { success: false, result: [], errors: [{ message: 'Parse error' }] };
    }
  };
  app.get('/api/settings', async (c) => {
    const controller = getAppController(c.env);
    return c.json({ success: true, data: await controller.getSettings() });
  });
  app.post('/api/settings', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const controller = getAppController(c.env);
    await controller.updateSettings(body);
    await controller.addLog({
      timestamp: new Date().toISOString(),
      action: 'API Credentials Updated',
      user: body.email || 'System Admin',
      status: 'Success'
    });
    return c.json({ success: true });
  });
  app.post('/api/license-check', async (c) => {
    const controller = getAppController(c.env);
    const settings = await controller.getSettings();
    if (!settings.accountId || !settings.apiKey) return c.json({ success: false, error: 'Credentials missing' }, { status: 400 });
    try {
      const headers = getCFHeaders(settings.email, settings.apiKey);
      const subRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/subscriptions`, { headers });
      const subData = await safeCFJson(subRes);
      if (!subData.success) return c.json({ success: false, error: 'Authentication failed' }, { status: 401 });
      return c.json({
        success: true,
        data: {
          plan: 'Zero Trust Enterprise',
          totalLicenses: 100,
          usedLicenses: 42,
          accessSub: true,
          gatewaySub: true,
          dlp: true,
          casb: true,
          rbi: true
        }
      });
    } catch (e) {
      return c.json({ success: false, error: 'Connection failed' }, { status: 500 });
    }
  });
  app.get('/api/reports', async (c) => {
    const controller = getAppController(c.env);
    return c.json({ success: true, data: await controller.listReports() });
  });
  app.get('/api/reports/:id', async (c) => {
    const controller = getAppController(c.env);
    const report = await controller.getReportById(c.req.param('id'));
    return report ? c.json({ success: true, data: report }) : c.json({ success: false, error: 'Not found' }, { status: 404 });
  });
  app.delete('/api/reports/:id', async (c) => {
    const controller = getAppController(c.env);
    const removed = await controller.removeReport(c.req.param('id'));
    return c.json({ success: removed });
  });
  app.get('/api/logs', async (c) => {
    const controller = getAppController(c.env);
    return c.json({ success: true, data: await controller.getLogs() });
  });
  app.post('/api/assess', async (c) => {
    const controller = getAppController(c.env);
    const settings = await controller.getSettings();
    const now = new Date();
    const mockAssessment = (isDemo = false): AssessmentReport => {
      const dates = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (29 - i));
        return d.toISOString().split('T')[0];
      });
      return {
        id: `rep_${Date.now()}`,
        date: now.toISOString().split('T')[0],
        status: 'Completed',
        score: isDemo ? 68 : 84,
        riskLevel: isDemo ? 'High' : 'Medium',
        summary: {
          totalApps: 184,
          aiApps: 32,
          shadowAiApps: 12,
          shadowUsage: 37.5,
          unapprovedApps: 4,
          dataExfiltrationRisk: '420 MB',
          complianceScore: 72,
          libraryCoverage: 62,
          casbPosture: 88
        },
        powerUsers: [
          { email: 'ciso@enterprise.com', name: 'Security Director', prompts: 124 },
          { email: 'dev-alpha@enterprise.com', name: 'Senior Developer', prompts: 89 }
        ],
        appLibrary: [
          { appId: '1', name: 'ChatGPT', category: 'AI', status: 'Approved', users: 84, risk: 'Low', risk_score: 15, genai_score: 95, policies: [{ name: 'Allow AI Chat', action: 'Allow', type: 'Gateway' }], usage: [{ clientIP: '192.168.1.1', userEmail: 'admin@corp.com', action: 'POST', date: now.toISOString(), bytesKB: 12, prompt: 'Explain zero trust architecture' }] },
          { appId: '2', name: 'Claude', category: 'AI', status: 'Review', users: 22, risk: 'Medium', risk_score: 45, genai_score: 92, policies: [{ name: 'Monitor AI Traffic', action: 'Log', type: 'Gateway' }], usage: [{ clientIP: '10.0.0.5', userEmail: 'dev@corp.com', action: 'POST', date: now.toISOString(), bytesKB: 45, prompt: 'Optimize this SQL query' }] },
          { appId: '3', name: 'Midjourney', category: 'AI', status: 'Unapproved', users: 8, risk: 'High', risk_score: 82, genai_score: 75, policies: [{ name: 'Block Image Gen', action: 'Block', type: 'Gateway' }], usage: [{ clientIP: '172.16.0.4', userEmail: 'shadow@corp.com', action: 'GET', date: now.toISOString(), bytesKB: 1200, prompt: 'Generate internal logo' }] },
          { appId: '4', name: 'GitHub Copilot', category: 'AI', status: 'Approved', users: 145, risk: 'Low', risk_score: 10, genai_score: 98, policies: [{ name: 'Enforce SSO', action: 'Allow', type: 'Access' }], usage: [] }
        ],
        securityCharts: {
          usageTrends: dates.map(d => ({
            date: d,
            'ChatGPT': Math.floor(Math.random() * 50 + 20),
            'Claude': Math.floor(Math.random() * 30 + 10),
            'GitHub Copilot': Math.floor(Math.random() * 80 + 60),
            'Midjourney': Math.floor(Math.random() * 10),
            'Perplexity': Math.floor(Math.random() * 15)
          })),
          statusTrends: dates.map(d => ({
            date: d,
            'Approved': 12 + Math.floor(Math.random() * 5),
            'Review': 8 + Math.floor(Math.random() * 3),
            'Unapproved': 4 + Math.floor(Math.random() * 2)
          })),
          dataTrends: dates.map(d => ({
            date: d,
            'Approved': Math.floor(Math.random() * 1000 + 500),
            'Unapproved': Math.floor(Math.random() * 200)
          })),
          mcpTrends: dates.map(d => ({
            date: d,
            'Access Time': Math.floor(Math.random() * 200 + 100),
            'Login Events': Math.floor(Math.random() * 50)
          }))
        }
      };
    };
    const report = mockAssessment(!settings.accountId);
    await controller.addReport(report);
    await controller.addLog({
      timestamp: new Date().toISOString(),
      action: 'Report Generated',
      user: settings.email || 'System Admin',
      status: 'Success'
    });
    return c.json({ success: true, data: report });
  });
  app.get('/api/sessions', async (c) => c.json({ success: true, data: await getAppController(c.env).listSessions() }));
  app.post('/api/sessions', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const sessionId = body.sessionId || crypto.randomUUID();
    await registerSession(c.env, sessionId, body.title || 'New Chat');
    return c.json({ success: true, data: { sessionId } });
  });
}