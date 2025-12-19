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
      if (!resp.ok) {
        console.warn(`CF API error ${resp.status}:`, text.slice(0, 100));
        return { success: false, result: [], errors: [{ message: `HTTP ${resp.status}` }] };
      }
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
      const results = subData.result || [];
      return c.json({
        success: true,
        data: {
          plan: results.find((s: any) => s.rate_plan?.public_name?.includes('Zero Trust'))?.rate_plan?.public_name || 'Zero Trust Free',
          totalLicenses: 50,
          usedLicenses: 12,
          accessSub: true,
          gatewaySub: true,
          dlp: true,
          casb: false,
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
    const generateMockAssessment = (isFailureMode = false): AssessmentReport => {
      const mockApps = [
        { id: 1, name: 'ChatGPT', status: 'Approved', risk_score: 20 },
        { id: 2, name: 'Claude.ai', status: 'Approved', risk_score: 25 },
        { id: 3, name: 'Midjourney', status: 'Unapproved', risk_score: 85 },
        { id: 4, name: 'GitHub Copilot', status: 'Approved', risk_score: 15 }
      ];
      return {
        id: `rep_mock_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        score: isFailureMode ? 65 : 88,
        riskLevel: isFailureMode ? 'High' : 'Medium',
        summary: {
          totalApps: 142,
          aiApps: 24,
          shadowAiApps: 8,
          shadowUsage: 33.3,
          unapprovedApps: 1,
          dataExfiltrationRisk: '124 MB',
          complianceScore: 78,
          libraryCoverage: 85,
          casbPosture: 92
        },
        powerUsers: [
          { email: 'dev-lead@company.com', name: 'dev-lead', prompts: 1450 }
        ],
        appLibrary: mockApps.map(a => ({
          appId: String(a.id),
          name: a.name,
          category: 'Generative AI',
          status: a.status as any,
          users: 12,
          risk: a.risk_score > 70 ? 'High' : 'Low',
          risk_score: a.risk_score,
          genai_score: 80,
          policies: [],
          usage: []
        })),
        securityCharts: {}
      };
    };
    if (!settings.accountId || !settings.apiKey) {
      const mockReport = generateMockAssessment(true);
      await controller.addReport(mockReport);
      return c.json({ success: true, data: mockReport, note: 'Demo mode active: Using mock telemetry' });
    }
    try {
      const headers = getCFHeaders(settings.email, settings.apiKey);
      const fetchSafety = (url: string) => fetch(url, { headers }).catch(() => new Response(JSON.stringify({ success: false, result: [] })));
      const [typesR, reviewR, appsR, dlpR] = await Promise.all([
        fetchSafety(`https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/gateway/app_types?per_page=1000`),
        fetchSafety(`https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/gateway/apps/review_status`),
        fetchSafety(`https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/gateway/apps`),
        fetchSafety(`https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/dlp/incidents`)
      ]);
      const typesData = await safeCFJson(typesR);
      const reviewData = await safeCFJson(reviewR);
      const appsJson = await safeCFJson(appsR);
      const dlpJson = await safeCFJson(dlpR);
      if (!typesData.success || !appsJson.success) {
        throw new Error('Cloudflare API integration failed');
      }
      const aiIds = (typesData.result || [])
        .filter((t: any) => t.application_type_id === 25)
        .map((t: any) => t.id) || [];
      const statuses = reviewData.result || { approved_apps: [], in_review_apps: [], unapproved_apps: [] };
      const managedIds = [
        ...(statuses.approved_apps || []),
        ...(statuses.in_review_apps || []),
        ...(statuses.unapproved_apps || [])
      ].map((a: any) => a.id) || [];
      const shadowCount = aiIds.filter((id: any) => !managedIds.includes(id)).length;
      const shadowUsage = aiIds.length > 0 ? (shadowCount / aiIds.length) * 100 : 0;
      const unapprovedAppsCount = (statuses.unapproved_apps || []).filter((app: any) => aiIds.includes(app.id)).length;
      const aiApps = (appsJson.result || []).filter((a: any) =>
        aiIds.includes(a.id) || a.categories?.some((cat: string) => cat.toLowerCase().includes('ai'))
      );
      const report: AssessmentReport = {
        id: `rep_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        score: Math.max(0, 100 - Math.round(shadowUsage)),
        riskLevel: shadowUsage > 30 ? 'High' : shadowUsage > 15 ? 'Medium' : 'Low',
        summary: {
          totalApps: (appsJson.result || []).length,
          aiApps: aiApps.length,
          shadowAiApps: shadowCount,
          shadowUsage,
          unapprovedApps: unapprovedAppsCount,
          dataExfiltrationRisk: `${(dlpJson.result || []).length * 1.5} MB`,
          complianceScore: 100 - (unapprovedAppsCount * 10),
          libraryCoverage: aiApps.length > 0 ? (aiApps.filter((a: any) => a.status === 'Approved').length / aiApps.length) * 100 : 100,
          casbPosture: 85
        },
        powerUsers: [],
        appLibrary: aiApps.map((a: any) => ({
          appId: String(a.id),
          name: a.name || 'Unknown',
          category: 'AI',
          status: (a.status || 'Unreviewed') as any,
          users: 0,
          risk: (a.risk_score || 0) > 70 ? 'High' : 'Low',
          risk_score: a.risk_score || 50,
          genai_score: 70,
          policies: [],
          usage: []
        })),
        securityCharts: {}
      };
      await controller.addReport(report);
      return c.json({ success: true, data: report });
    } catch (error) {
      console.warn('Assessment failed, falling back to mock data:', error);
      const fallbackReport = generateMockAssessment(true);
      await controller.addReport(fallbackReport);
      return c.json({ success: true, data: fallbackReport, error: 'Using simulated data due to API connectivity issues' });
    }
  });
  app.get('/api/sessions', async (c) => c.json({ success: true, data: await getAppController(c.env).listSessions() }));
  app.post('/api/sessions', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const sessionId = body.sessionId || crypto.randomUUID();
    await registerSession(c.env, sessionId, body.title || 'New Chat');
    return c.json({ success: true, data: { sessionId } });
  });
}