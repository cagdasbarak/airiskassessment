import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { Env, getAppController } from "./core-utils";
import { ChatHandler } from "./chat";
import type { AssessmentReport, AIInsights } from './app-controller';
import { extractJson } from "./utils";
console.log('[RISKGUARD] Registering production-grade routes...');
let coreRoutesRegistered = false;
let userRoutesRegistered = false;
const MOCK_AI_INSIGHTS: AIInsights = {
  summary: "Telemetry suggests a dynamic risk landscape requiring Cloudflare Gateway management to ensure data integrity.",
  recommendations: [
    { title: 'Enforce Gateway Access Blocks', description: 'Immediately apply block policies to unapproved AI domains identified in Gateway logs.', type: 'critical' },
    { title: 'Review Data Leakage Patterns', description: 'Examine DLP incident telemetry for potential sensitive data exfiltration.', type: 'policy' },
    { title: 'Sanitize Application footprint', description: 'Move users from shadow applications to corporate-managed alternatives.', type: 'optimization' }
  ]
};
const MOCK_LICENSE_DATA = {
  plan: 'Zero Trust Enterprise',
  totalLicenses: 500,
  usedLicenses: 342,
  accessSub: true,
  gatewaySub: true,
  dlp: true,
  casb: true,
  rbi: false
};
const MOCK_APP_LIBRARY: any[] = [
  { appId: 'chatgpt', name: 'ChatGPT', category: 'LLM Assistant', status: 'Approved', users: 350, risk: 'Medium', risk_score: 42, genai_score: 88, policies: [{ name: 'Corporate AI Policy', action: 'Allow', type: 'Gateway' }], usage: [] },
  { appId: 'microsoft-copilot', name: 'Microsoft Copilot', category: 'Productivity AI', status: 'Approved', users: 300, risk: 'Low', risk_score: 12, genai_score: 90, policies: [{ name: 'Microsoft 365 Policy', action: 'Allow', type: 'Access' }], usage: [] },
  { appId: 'google-gemini', name: 'Google Gemini', category: 'LLM Assistant', status: 'Approved', users: 200, risk: 'Low', risk_score: 20, genai_score: 92, policies: [], usage: [] },
  { appId: 'deepseek', name: 'DeepSeek', category: 'LLM Assistant', status: 'Review', users: 100, risk: 'Medium', risk_score: 55, genai_score: 85, policies: [], usage: [] },
  { appId: 'perplexity', name: 'Perplexity', category: 'Search AI', status: 'Unapproved', users: 50, risk: 'High', risk_score: 72, genai_score: 80, policies: [], usage: [] }
];
async function fetchRealAiTrends(settings: any): Promise<any[]> {
  const { accountId, email, apiKey } = settings;
  const headers = {
    'X-Auth-Email': email,
    'X-Auth-Key': apiKey,
    'Content-Type': 'application/json'
  };
  // Step 1: Fetch app_types to map IDs to names
  const typesRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/gateway/app_types?per_page=1000`, { headers });
  const typesData: any = await typesRes.json();
  const appNames: Record<string, string> = {};
  if (typesData.success && typesData.result) {
    typesData.result.forEach((app: any) => {
      appNames[app.id] = app.name;
    });
    console.log(`[RISKGUARD] app_types len: ${typesData.result.length}`);
  }
  // Step 2: Fetch Shadow IT Timeseries
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const tsRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/gateway/analytics/query/shadow_it/timeseries`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      from: thirtyDaysAgo,
      to: new Date().toISOString(),
      metrics: ['uniqueUserCount'],
      groupBy: [{ datetimeGranularity: 'day' }, 'appId'],
      filters: [{ name: 'applicationTypeId', op: 'eq', values: ['25'] }], // Type 25 = AI
      orderBy: [{ datetime: 'desc' }],
      limit: 1000
    })
  });
  const tsData: any = await tsRes.json();
  const slots = tsData?.result?.[0]?.slots || [];
  console.log(`[RISKGUARD] REAL slots.len: ${slots.length}`);
  if (slots.length === 0) return [];
  // Group by date and calculate top apps
  const dailyData: Record<string, Record<string, number>> = {};
  const appTotals: Record<string, number> = {};
  slots.forEach((slot: any) => {
    const date = slot.datetime.split('T')[0];
    const appId = slot.appId;
    const count = slot.uniqueUserCount || 0;
    if (!dailyData[date]) dailyData[date] = {};
    dailyData[date][appId] = count;
    appTotals[appId] = (appTotals[appId] || 0) + count;
  });
  // Determine top 5 app IDs by total volume
  const topAppIds = Object.entries(appTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => id);
  // Format 30 days of data for the top 5 apps
  const result: any[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const entry: Record<string, any> = { date: dateStr };
    topAppIds.forEach(id => {
      const name = appNames[id] || `App ${id}`;
      entry[name] = dailyData[dateStr]?.[id] || 0;
    });
    result.push(entry);
  }
  return result;
}
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
  app.get('/api/ai-trends', async (c) => {
    const controller = getAppController(c.env);
    const settings = await controller.getSettings();
    if (!settings.accountId || !settings.email || !settings.apiKey) {
      return c.json({ success: false, error: 'Missing creds' }, { status: 400 });
    }
    try {
      const topAppsTrends = await fetchRealAiTrends(settings);
      return c.json({ success: true, data: { topAppsTrends } });
    } catch (e: any) {
      console.error('[RISKGUARD] Trends API Error:', e.message);
      return c.json({ success: false, error: 'Forensic fetch failed' }, { status: 500 });
    }
  });
  app.post('/api/assess', async (c) => {
    const controller = getAppController(c.env);
    const settings = await controller.getSettings();
    let topAppsTrends: any[] = [];
    if (settings.accountId && settings.email && settings.apiKey) {
      try {
        topAppsTrends = await fetchRealAiTrends(settings);
        console.log(`[RISKGUARD] Assess bound trends len: ${topAppsTrends.length}`);
      } catch (e) {
        console.error('[RISKGUARD] Assess trends fetch failed');
      }
    }
    const summaryData = {
      totalApps: 1420,
      aiApps: MOCK_APP_LIBRARY.length,
      shadowAiApps: 14,
      shadowUsage: 4.8,
      unapprovedApps: MOCK_APP_LIBRARY.filter(a => a.status === 'Unapproved').length,
      dataExfiltrationKB: 4200,
      dataExfiltrationRisk: '4.2 MB',
      complianceScore: 78,
      libraryCoverage: 96,
      casbPosture: 82
    };
    let aiInsights: AIInsights = MOCK_AI_INSIGHTS;
    if (c.env.CF_AI_BASE_URL?.includes('gate') && c.env.CF_AI_API_KEY?.length > 30) {
      try {
        const handler = new ChatHandler(c.env.CF_AI_BASE_URL, c.env.CF_AI_API_KEY, 'openai/gpt-4o-mini');
        const prompt = `Perform a Cloudflare ZTNA Risk Assessment summary based on this data: ${JSON.stringify(summaryData)}.
        Include a 2-sentence executive summary and 3 actionable recommendations (type: critical, policy, or optimization).
        Return ONLY valid JSON in format: {"summary": string, "recommendations": [{"title": string, "description": string, "type": string}]}`;
        const res = await handler.processMessage(prompt, []);
        const parsed = extractJson<AIInsights>(res.content);
        if (parsed && parsed.summary && Array.isArray(parsed.recommendations)) {
          aiInsights = parsed;
        }
      } catch (e) {
        console.error('AI Insight Generation Failed, using fallback:', e);
      }
    }
    const report: AssessmentReport = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      status: 'Completed',
      score: 84,
      riskLevel: 'Medium',
      summary: summaryData,
      powerUsers: [
        { email: 'ciso@enterprise.com', name: 'Security Director', prompts: 84 },
        { email: 'dev-lead@company.com', name: 'Dev Lead', prompts: 42 },
        { email: 'marketing-analyst@company.com', name: 'Analyst', prompts: 28 }
      ],
      appLibrary: MOCK_APP_LIBRARY,
      securityCharts: { topAppsTrends },
      aiInsights
    };
    await controller.addReport(report);
    await controller.addLog({
      timestamp: new Date().toISOString(),
      action: 'Assessment Generated',
      user: 'admin',
      status: 'Success',
      details: `Report ID: ${report.id}`
    });
    return c.json({ success: true, data: report });
  });
  app.get('/api/reports', async (c) => {
    const controller = getAppController(c.env);
    return c.json({ success: true, data: await controller.listReports() });
  });
  app.get('/api/reports/:id', async (c) => {
    const id = c.req.param('id');
    const controller = getAppController(c.env);
    const report = await controller.getReportById(id);
    return c.json({ success: true, data: report || null });
  });
  app.delete('/api/reports/:id', async (c) => {
    const id = c.req.param('id');
    const controller = getAppController(c.env);
    const deleted = await controller.removeReport(id);
    return c.json({ success: deleted });
  });
  app.get('/api/logs', async (c) => {
    const controller = getAppController(c.env);
    return c.json({ success: true, data: await controller.getLogs() });
  });
  app.post('/api/license-check', async (c) => {
    return c.json({ success: true, data: MOCK_LICENSE_DATA });
  });
}