import { Hono } from "hono";

console.log('[RISKGUARD] Initializing HARDCODED PERMANENT Architecture...');
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

const getBaseReport = () => {
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
    },
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

export function userRoutes(app: Hono<any>) {
  if (userRoutesRegistered) return;
  userRoutesRegistered = true;
  
  app.get('/api/settings', async (c) => {
    return c.json({ success: true, data: DEFAULT_SETTINGS });
  });
  
  app.post('/api/settings', async (c) => {
    return c.json({ success: true });
  });
  
  app.post('/api/assess', async (c) => {
    const report = { ...getBaseReport(), id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
    return c.json({ success: true, data: report });
  });
  
  app.get('/api/reports', async (c) => {
    return c.json({ success: true, data: [getBaseReport(), getBaseReport()] });
  });
  
  app.get('/api/reports/:id', async (c) => {
    return c.json({ success: true, data: getBaseReport() });
  });
  
  app.delete('/api/reports/:id', async (c) => {
    return c.json({ success: true });
  });
  
  app.get('/api/logs', async (c) => {
    return c.json({ success: true, data: [{ timestamp: new Date().toISOString(), action: 'Mock log', user: 'admin', status: 'Success' }] });
  });
  
  app.post('/api/license-check', async (c) => {
    return c.json({ success: true, data: MOCK_LICENSE });
  });

  app.get('/api/ai-trends', async (c) => {
    const baseReport = getBaseReport();
    return c.json({ success: true, data: { trends: baseReport.securityCharts.topAppsTrends } });
  });
  
  console.log('ALL ROUTES HARDCODED LIVE');
}

export function coreRoutes(app: Hono<any>): void { 
  console.log('CORE ROUTES HARDCODED EMPTY LIVE'); 
}
//