import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { Env, getAppController } from "./core-utils";
import type { AssessmentReport } from './app-controller';
console.log('[RISKGUARD] Initializing HARDCODED PERMANENT Architecture...');
let coreRoutesRegistered = false;
let userRoutesRegistered = false;
const DEFAULT_SETTINGS = {
  accountId: 'cf-enterprise-001',
  email: 'admin@enterprise.com',
  apiKey: '••••••••••••••••',
  cloudflareContact: {
    name: 'Sarah Chen',
    role: 'Solutions Architect',
    email: 'schen@cloudflare.com',
    team: 'Global Security'
  },
  customerContact: {
    customerName: 'Acme Corp',
    name: 'David Miller',
    role: 'CISO',
    email: 'david.miller@acme.com'
  }
};
const MOCK_LICENSE = {
  plan: 'Enterprise Zero Trust',
  totalLicenses: 1000,
  usedLicenses: 742,
  accessSub: true,
  gatewaySub: true,
  dlp: true,
  casb: true,
  rbi: true
};
const getBaseReport = (): AssessmentReport => {
  // Add slight variance to mock data for realism
  const scoreVariance = Math.floor(Math.random() * 10) - 5;
  const usageVariance = (Math.random() * 0.8) - 0.4;
  return {
    id: 'rep_permanent_live_001',
    date: new Date().toISOString().split('T')[0],
    status: 'Completed',
    score: 84 + scoreVariance,
    riskLevel: scoreVariance > 2 ? 'Low' : 'Medium',
    summary: {
      totalApps: 1240,
      aiApps: 18,
      shadowAiApps: 6,
      shadowUsage: 3.2 + usageVariance,
      unapprovedApps: 4,
      dataExfiltrationKB: 840 + Math.floor(usageVariance * 100),
      dataExfiltrationRisk: `${840 + Math.floor(usageVariance * 100)} KB`,
      complianceScore: 92,
      libraryCoverage: 98,
      casbPosture: 85
    } as any,
    powerUsers: [
      { email: 'engineering-lead@acme.com', name: 'Alex Rivera', prompts: 156 + Math.floor(scoreVariance * 2) },
      { email: 'product-manager@acme.com', name: 'Jordan Smith', prompts: 89 + scoreVariance },
      { email: 'marketing-dir@acme.com', name: 'Elena Vance', prompts: 42 }
    ],
    appLibrary: [
      { appId: 'chatgpt', name: 'ChatGPT', category: 'GenAI Assistant', status: 'Approved', users: 450, risk: 'Low', risk_score: 15, genai_score: 95, policies: [], usage: [] },
      { appId: 'github-copilot', name: 'GitHub Copilot', category: 'Code Assistant', status: 'Approved', users: 320, risk: 'Low', risk_score: 10, genai_score: 98, policies: [], usage: [] },
      { appId: 'claude-ai', name: 'Claude', category: 'GenAI Assistant', status: 'Review', users: 85, risk: 'Medium', risk_score: 45, genai_score: 90, policies: [], usage: [] },
      { appId: 'midjourney', name: 'Midjourney', category: 'Image Gen', status: 'Unapproved', users: 12, risk: 'High', risk_score: 82, genai_score: 85, policies: [], usage: [] },
      { appId: 'perplexity', name: 'Perplexity', category: 'Search AI', status: 'Review', users: 28, risk: 'Medium', risk_score: 35, genai_score: 92, policies: [], usage: [] }
    ],
    securityCharts: {
      topAppsTrends: [
        { date: '2024-05-01', ChatGPT: 400, Copilot: 300, Claude: 50 },
        { date: '2024-05-10', ChatGPT: 420, Copilot: 310, Claude: 60 },
        { date: '2024-05-20', ChatGPT: 450, Copilot: 320, Claude: 85 }
      ]
    },
    aiInsights: {
      summary: "Organization shows high adoption of sanctioned AI tools with minimal shadow usage. Focus should remain on DLP policy enforcement for unapproved image generation endpoints.",
      recommendations: [
        { title: 'Restrict Midjourney Access', description: 'Block unapproved image generation domains via Gateway to prevent IP leakage.', type: 'critical' },
        { title: 'Expand Copilot License', description: 'High engagement detected; consider consolidating AI spend into managed Copilot seats.', type: 'optimization' },
        { title: 'Enable DLP for LLMs', description: 'Activate sensitive data detection on all ChatGPT outbound traffic.', type: 'policy' }
      ]
    }
  };
};
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
    const settings = await controller.getSettings();
    return c.json({ success: true, data: settings || DEFAULT_SETTINGS });
  });
  app.post('/api/settings', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const controller = getAppController(c.env);
    await controller.updateSettings(body);
    await controller.addLog({
      timestamp: new Date().toISOString(),
      action: 'Settings Saved',
      user: body.email || 'System Admin',
      status: 'Success'
    });
    return c.json({ success: true });
  });
  app.post('/api/assess', async (c) => {
    const controller = getAppController(c.env);
    const report = { ...getBaseReport(), id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0] };
    await controller.addReport(report);
    await controller.addLog({
      timestamp: new Date().toISOString(),
      action: 'Risk Assessment Generated',
      user: 'admin',
      status: 'Success',
      details: `Report ID: ${report.id.slice(0, 8)}`
    });
    return c.json({ success: true, data: report });
  });
  app.get('/api/reports', async (c) => {
    const controller = getAppController(c.env);
    const reports = await controller.listReports();
    return c.json({ success: true, data: reports });
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
        action: 'Report Archive Purged',
        user: 'admin',
        status: 'Warning',
        details: `Deleted Report: ${id.slice(0, 8)}`
      });
    }
    return c.json({ success: deleted });
  });
  app.get('/api/logs', async (c) => {
    const controller = getAppController(c.env);
    const logs = await controller.getLogs();
    return c.json({ success: true, data: logs });
  });
  app.post('/api/license-check', async (c) => {
    return c.json({ success: true, data: MOCK_LICENSE });
  });
  console.log('[RISKGUARD] ROUTES HARDCODED LIVE');
}