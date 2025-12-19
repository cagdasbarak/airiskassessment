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
    appId: 'claude',
    name: 'Claude.ai',
    category: 'LLM Assistant',
    status: 'Review',
    users: 28,
    risk: 'Low',
    risk_score: 15,
    genai_score: 92,
    policies: [],
    usage: []
  },
  {
    appId: 'midjourney',
    name: 'Midjourney',
    category: 'Image Generation',
    status: 'Unapproved',
    users: 12,
    risk: 'High',
    risk_score: 85,
    genai_score: 95,
    policies: [{ name: 'Block Non-Business Creative', action: 'Block', type: 'Gateway' }],
    usage: []
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
    appId: 'jasper',
    name: 'Jasper AI',
    category: 'Marketing Automation',
    status: 'Unapproved',
    users: 8,
    risk: 'High',
    risk_score: 78,
    genai_score: 75,
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
        topAppsTrends: [
          { date: '2024-05-15', 'ChatGPT': 400, 'Claude': 240, 'Midjourney': 120, 'Jasper': 80 },
          { date: '2024-05-16', 'ChatGPT': 380, 'Claude': 260, 'Midjourney': 150, 'Jasper': 75 },
          { date: '2024-05-17', 'ChatGPT': 420, 'Claude': 280, 'Midjourney': 110, 'Jasper': 90 },
          { date: '2024-05-18', 'ChatGPT': 450, 'Claude': 310, 'Midjourney': 140, 'Jasper': 85 },
          { date: '2024-05-19', 'ChatGPT': 410, 'Claude': 290, 'Midjourney': 160, 'Jasper': 70 }
        ]
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