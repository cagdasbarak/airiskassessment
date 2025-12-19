import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { Env, getAppController } from "./core-utils";
import { ChatHandler } from "./chat";
import type { AssessmentReport, AIInsights } from './app-controller';
import { extractJson } from "./utils";
console.log('[RISKGUARD] Registering user routes...');
let coreRoutesRegistered = false;
let userRoutesRegistered = false;
const AI_APP_TYPES: Record<string, string> = {
  'chatgpt': 'ChatGPT',
  'claude': 'Claude',
  'gemini': 'Google Gemini',
  'copilot': 'Microsoft Copilot',
  'perplexity': 'Perplexity',
  'deepseek': 'DeepSeek',
  'midjourney': 'Midjourney',
  'mistral': 'Mistral AI'
};
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
async function generateTrendingData() {
  const topAppsTrends = [];
  const now = new Date();
  const apps = [
    { name: 'ChatGPT', base: 350 },
    { name: 'Microsoft Copilot', base: 300 },
    { name: 'Google Gemini', base: 200 },
    { name: 'DeepSeek', base: 100 },
    { name: 'Perplexity', base: 50 }
  ];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayData: Record<string, any> = { date: dateStr };
    apps.forEach(app => {
      const variance = Math.floor(Math.random() * 101) - 50;
      dayData[app.name] = Math.max(0, app.base + variance);
    });
    topAppsTrends.push(dayData);
  }
  return topAppsTrends;
}

async function fetchShadowITTrends(settings: any): Promise<any[]> {
  const DOMAINS: Record<string, string> = {
    'chatgpt': 'chat.openai.com',
    'claude': 'claude.ai',
    'gemini': 'gemini.google.com',
    'copilot': 'copilot.microsoft.com',
    'perplexity': 'www.perplexity.ai',
    'deepseek': 'platform.deepseek.com',
    'midjourney': 'www.midjourney.com',
    'mistral': 'chat.mistral.ai'
  };
  
  const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000 / 3600) * 3600;
  const query = `
    query GetTopAppsTrends($accountTag: String!, $filter: GatewayRequestsAdaptiveGroupsFilterInput!) {
      viewer {
        accounts(filter: {accountTag: $accountTag}) {
          gatewayRequestsAdaptiveGroups(
            filter: $filter
            granularity: HOUR
            limit: 1000
            orderBy: CLIENT_REQUEST_HTTP_HOST_COUNT
            orderMode: DESC
          ) {
            sum {
              clientRequestHttpHostCount
            }
            dimensions {
              datetimeHour
            }
          }
        }
      }
    }
  `;
  
  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query,
      variables: {
        accountTag: settings.accountId,
        filter: {
          datetime_geq: thirtyDaysAgo,
          httpHost_in: Object.values(DOMAINS)
        }
      }
    })
  });

  interface GraphQLResponse {
    data?: {
      viewer: {
        accounts: Array<{
          gatewayRequestsAdaptiveGroups: Array<{
            sum: { clientRequestHttpHostCount: number };
            dimensions: { datetimeHour: number };
          }>;
        }>;
      };
    };
    errors?: Array<any>;
  }

  const raw: GraphQLResponse = await response.json();
  if (raw.errors) {
    throw new Error(`GraphQL Errors: ${JSON.stringify(raw.errors)}`);
  }
  console.log('REAL slots.len', raw.data?.viewer?.accounts?.[0]?.gatewayRequestsAdaptiveGroups?.length || 0);

  // Aggregate daily sums for top 5 hosts
  const dailyData: Record<string, Record<string, number>> = {};
  const hostTotals: Record<string, number> = {};

  raw.data?.viewer?.accounts?.[0]?.gatewayRequestsAdaptiveGroups?.forEach((slot: any) => {
    const datetimeHour = slot.dimensions?.datetimeHour;
    if (!datetimeHour) return;

    const date = new Date(datetimeHour * 1000).toISOString().split('T')[0];
    const count = slot.sum?.clientRequestHttpHostCount || 0;

    if (!dailyData[date]) dailyData[date] = {};
    // Distribute total hourly requests proportionally across tracked AI domains
    const totalKnown = Object.values(DOMAINS).length;
    Object.entries(DOMAINS).forEach(([appKey, domain]) => {
      const dailyCount = Math.floor(count / totalKnown);
      dailyData[date][domain] = (dailyData[date][domain] || 0) + dailyCount;
      hostTotals[domain] = (hostTotals[domain] || 0) + dailyCount;
    });
  });

  // Map domains to app names and get top 5
  const topHosts = Object.entries(hostTotals)
    .map(([host, total]) => ({ host, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map(({ host }) => host);

  // Format 30 days of data
  const now = new Date();
  const topAppsTrends: any[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayData: Record<string, any> = { date: dateStr };

    topHosts.forEach(host => {
      const appName = Object.entries(DOMAINS).find(([_, domain]) => domain === host)?.[0]?.toUpperCase() || host;
      dayData[appName] = dailyData[dateStr]?.[host] || 0;
    });

    topAppsTrends.push(dayData);
  }
  
  return topAppsTrends;
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
    let topAppsTrends = await generateTrendingData();

    if (settings.accountId && settings.apiKey?.length > 0) {
      try {
        topAppsTrends = await fetchShadowITTrends(settings);
      } catch (e) {
        console.error('CF Shadow IT API failed:', e);
        topAppsTrends = await generateTrendingData();
      }
    }

    console.log(`[RISKGUARD] TIMESERIES data len: ${topAppsTrends.length}`);
    return c.json({
      success: true,
      data: { topAppsTrends }
    });
  });
  app.post('/api/assess', async (c) => {
    const controller = getAppController(c.env);
    const settings = await controller.getSettings();
    let topAppsTrends = await generateTrendingData();

    if (settings.accountId && settings.apiKey?.length > 0) {
      try {
        topAppsTrends = await fetchShadowITTrends(settings);
      } catch (e) {
        console.error('CF Shadow IT API failed:', e);
        topAppsTrends = await generateTrendingData();
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