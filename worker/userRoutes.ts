import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { Env, getAppController, registerSession } from "./core-utils";
import type { AssessmentReport } from './app-controller';
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
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  if (userRoutesRegistered) return;
  userRoutesRegistered = true;
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
    // MOCK DATA FETCHES (Simulating JQ requirements)
    const mockAppTypes = [
      { id: "gpt-4", application_type_id: 25 },
      { id: "claude-3", application_type_id: 25 },
      { id: "midjourney-v6", application_type_id: 25 },
      { id: "copilot-ext", application_type_id: 25 },
      { id: "notion-ai", application_type_id: 25 },
      { id: "slack", application_type_id: 10 }
    ];
    const mockReviewStatus = {
      approved_apps: ["gpt-4", "copilot-ext"],
      in_review_apps: ["claude-3"],
      unapproved_apps: ["midjourney-v6"]
    };
    // PRECISION JQ LOGIC
    const ai_ids = (mockAppTypes || []).filter(app => app.application_type_id === 25).map(app => app.id);
    const total_ai = ai_ids.length;
    const managed_set = [
      ...(mockReviewStatus.approved_apps || []),
      ...(mockReviewStatus.in_review_apps || []),
      ...(mockReviewStatus.unapproved_apps || [])
    ];
    const managed_count = ai_ids.filter(id => managed_set.includes(id)).length;
    const shadowUsage = total_ai > 0 ? ((total_ai - managed_count) / total_ai) * 100 : 0;
    const unapprovedAppsCount = (mockReviewStatus.unapproved_apps || []).filter(id => ai_ids.includes(id)).length;
    const report: AssessmentReport = {
      id: `rep_${Date.now()}`,
      date: now.toISOString().split('T')[0],
      status: 'Completed',
      score: Math.max(0, Math.min(100, 100 - (shadowUsage / 1.5))), // Hardened scoring logic
      riskLevel: shadowUsage > 50 ? 'High' : shadowUsage > 20 ? 'Medium' : 'Low',
      summary: {
        totalApps: 184,
        aiApps: total_ai,
        shadowAiApps: Math.max(0, total_ai - managed_count),
        shadowUsage: Number(shadowUsage.toFixed(2)),
        unapprovedApps: unapprovedAppsCount,
        dataExfiltrationRisk: shadowUsage > 40 ? '420 MB' : '12 MB',
        complianceScore: 72,
        libraryCoverage: 62,
        casbPosture: 88
      },
      powerUsers: [],
      appLibrary: [],
      securityCharts: {}
    };
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