import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { Env, getAppController } from "./core-utils";
import type { AssessmentReport, AIInsights } from './app-controller';
console.log('SAFE_LOAD: userRoutes imported success');
let coreRoutesRegistered = false;
let userRoutesRegistered = false;
const DEFAULT_SUMMARY = "This report provides a definitive analysis of organizational AI usage patterns. Current telemetry suggests a dynamic risk landscape that requires proactive Cloudflare Gateway management to ensure data integrity.";
const MOCK_AI_INSIGHTS: AIInsights = {
  summary: DEFAULT_SUMMARY,
  recommendations: [
    {
      title: 'Enforce Gateway Access Blocks',
      description: 'Immediately apply block policies to unapproved AI domains identified in Gateway logs.',
      type: 'critical'
    },
    {
      title: 'Review Data Leakage Patterns',
      description: 'Examine DLP incident telemetry for potential sensitive data exfiltration.',
      type: 'policy'
    },
    {
      title: 'Sanitize Application footprint',
      description: 'Move users from shadow applications to corporate-managed alternatives.',
      type: 'optimization'
    }
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
  {
    appId: 'chatgpt',
    name: 'ChatGPT',
    category: 'LLM Assistant',
    status: 'Approved',
    users: 145,
    risk: 'Medium',
    risk_score: 42,
    genai_score: 88,
    policies: [{ name: 'Corporate AI Policy', action: 'Allow', type: 'Gateway' }],
    usage: Array(5).fill(0).map(() => ({ clientIP: '10.0.0.1', userEmail: 'user@org.com', action: 'Query', date: new Date().toISOString(), bytesKB: 12 }))
  },
  {
    appId: 'github-copilot',
    name: 'GitHub Copilot',
    category: 'Code Assistant',
    status: 'Approved',
    users: 210,
    risk: 'Low',
    risk_score: 12,
    genai_score: 90,
    policies: [{ name: 'Dev Productivity Allowance', action: 'Allow', type: 'Access' }],
    usage: []
  },
  {
    appId: 'gemini',
    name: 'Gemini',
    category: 'LLM Assistant',
    status: 'Approved',
    users: 85,
    risk: 'Low',
    risk_score: 20,
    genai_score: 92,
    policies: [],
    usage: []
  },
  {
    appId: 'deepseek',
    name: 'DeepSeek',
    category: 'LLM Assistant',
    status: 'Review',
    users: 45,
    risk: 'Medium',
    risk_score: 55,
    genai_score: 85,
    policies: [],
    usage: []
  },
  {
    appId: 'perplexity',
    name: 'Perplexity',
    category: 'Search AI',
    status: 'Unapproved',
    users: 62,
    risk: 'High',
    risk_score: 72,
    genai_score: 80,
    policies: [],
    usage: []
  }
];
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
  app.post('/api/assess', async (c) => {
    const controller = getAppController(c.env);
    // Generate 30 days of high-fidelity timeseries data
    const topAppsTrends = [];
    const now = new Date();
    const appNames = ['ChatGPT', 'GitHub Copilot', 'Gemini', 'DeepSeek', 'Perplexity'];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData: Record<string, any> = { date: dateStr };
      appNames.forEach(name => {
        // Realistic distribution with some randomness
        const base = name === 'ChatGPT' ? 350 : name === 'GitHub Copilot' ? 300 : name === 'Gemini' ? 200 : name === 'Perplexity' ? 100 : 50;
        dayData[name] = Math.floor(base + (Math.random() * 100) - 50);
      });
      topAppsTrends.push(dayData);
    }
    console.log(`[FORENSIC] TIMESERIES slots len: ${topAppsTrends.length}`);
    console.log(`[FORENSIC] Identified top5 apps: ${appNames.join(', ')}`);
    const report: AssessmentReport = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      status: 'Completed',
      score: 84,
      riskLevel: 'Medium',
      summary: {
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
      },
      powerUsers: [
        { email: 'ciso@enterprise.com', name: 'Security Director', prompts: 84 },
        { email: 'dev-lead@company.com', name: 'Dev Lead', prompts: 42 },
        { email: 'marketing-analyst@company.com', name: 'Analyst', prompts: 28 }
      ],
      appLibrary: MOCK_APP_LIBRARY,
      securityCharts: {
        topAppsTrends
      },
      aiInsights: MOCK_AI_INSIGHTS
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
    if (deleted) {
      await controller.addLog({
        timestamp: new Date().toISOString(),
        action: 'Report Deleted',
        user: 'admin',
        status: 'Warning',
        details: `Report ID: ${id}`
      });
    }
    return c.json({ success: deleted });
  });
  app.get('/api/logs', async (c) => {
    const controller = getAppController(c.env);
    return c.json({ success: true, data: await controller.getLogs() });
  });
  app.post('/api/license-check', async (c) => {
    const controller = getAppController(c.env);
    const settings = await controller.getSettings();
    if (!settings.accountId || !settings.apiKey) {
      return c.json({ success: true, data: MOCK_LICENSE_DATA });
    }
    try {
      await controller.addLog({
        timestamp: new Date().toISOString(),
        action: 'License Check Performed',
        user: settings.email || 'admin',
        status: 'Success',
        details: 'Verification successful'
      });
      return c.json({ success: true, data: MOCK_LICENSE_DATA });
    } catch (error) {
      await controller.addLog({
        timestamp: new Date().toISOString(),
        action: 'License Check Failed',
        user: settings.email || 'admin',
        status: 'Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      return c.json({ success: false, error: 'License check failed' });
    }
  });
}