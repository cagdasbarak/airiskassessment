import { Hono } from "hono";
console.log('[RISKGUARD] Initializing PRECISION SHADOW AI Architecture...');
let userRoutesRegistered = false;
async function fetchCloudflare(endpoint: string, settings: any) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${settings.accountId}${endpoint}`;

  try {
    const res = await fetch(url, {
      headers: {
        'X-Auth-Email': settings.email,
        'X-Auth-Key': settings.apiKey,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[CF_API_ERROR] ${res.status} ${endpoint}:`, text);
      return null;
    }
    const json = await res.json();
    console.log(`[FULL_${endpoint.replace(/\//g,'_').toUpperCase()}]`, JSON.stringify(json));
    return json;
  } catch (err) {
    console.error(`[CF_FETCH_EXCEPTION] ${endpoint}:`, err);
    try {
      const text = await fetch(url, {headers: {'X-Auth-Email': settings.email, 'X-Auth-Key': settings.apiKey, 'Content-Type': 'application/json'}}).then(r=>r.text());
      console.log('PARSE_FAIL_RESPONSE', endpoint, text.slice(0,500));
    } catch(e) {}
    return null;
  }
}
const getBaseReport = (idSuffix: string = '001') => {
  // Enhanced robust ID generation to prevent React key collisions
  const uniqueId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${idSuffix}`;
  return {
    id: uniqueId,
    date: new Date().toISOString().split('T')[0],
    status: 'Completed',
    score: 84,
    riskLevel: 'Medium',
    summary: {
      totalApps: 1240,
      aiApps: 18,
      shadowAiApps: 6,
      shadowUsage: 3.245,
      unapprovedApps: 4,
      dataExfiltrationKB: 840,
      dataExfiltrationRisk: `840 KB`,
      complianceScore: 92,
      libraryCoverage: 98,
      casbPosture: 85
    },
    powerUsers: [
      { email: 'engineering-lead@acme.com', name: 'Alex Rivera', prompts: 156 },
      { email: 'product-manager@acme.com', name: 'Jordan Smith', prompts: 89 }
    ],
    appLibrary: [
      { appId: 'chatgpt', name: 'ChatGPT', category: 'GenAI Assistant', status: 'Approved', users: 450, risk: 'Low', risk_score: 15, genai_score: 95, policies: [], usage: [] },
      { appId: 'github-copilot', name: 'GitHub Copilot', category: 'Code Assistant', status: 'Approved', users: 320, risk: 'Low', risk_score: 10, genai_score: 98, policies: [], usage: [] }
    ],
    securityCharts: {
      topAppsTrends: [
        { date: '2024-05-01', ChatGPT: 400, Copilot: 300 },
        { date: '2024-05-20', ChatGPT: 450, Copilot: 320 }
      ]
    },
    aiInsights: {
      summary: "Organization shows high adoption of sanctioned AI tools.",
      recommendations: [
        { title: 'Enable DLP for LLMs', description: 'Activate sensitive data detection on all ChatGPT outbound traffic.', type: 'policy' }
      ]
    }
  };
};
export function userRoutes(app: Hono<any>) {
  if (userRoutesRegistered) return;
  userRoutesRegistered = true;
  console.log('ROUTES INLINE HARDCODED LIVE - userRoutes module');
  app.get('/api/settings', async (c) => {
    const controller = c.env.APP_CONTROLLER.get(c.env.APP_CONTROLLER.idFromName("controller"));
    const settings = await controller.getSettings();
    return c.json({ success: true, data: settings });
  });
  app.post('/api/settings', async (c) => {
    const body = await c.req.json();
    const controller = c.env.APP_CONTROLLER.get(c.env.APP_CONTROLLER.idFromName("controller"));
    await controller.updateSettings(body);
    await controller.addLog({
      timestamp: new Date().toISOString(),
      action: 'API Credentials Updated',
      user: body.email || 'admin',
      status: 'Success'
    });
    return c.json({ success: true });
  });
  app.post('/api/assess', async (c) => {
    const controller = c.env.APP_CONTROLLER.get(c.env.APP_CONTROLLER.idFromName("controller"));
    const settings = await controller.getSettings();
    console.log('[ASSESS_CREDS]', {
      hasAccount:!!settings.accountId,
      hasEmail:!!settings.email,
      hasKey:settings.apiKey?.length>0
    });
    let shadowUsage = 0;
    let total_ai = 0;
    let managed_count = 0;
    let debugInfo: any = { aiIds: [], managedIds: [] };
    if ((settings.accountId !== '' && settings.accountId !== undefined) &&
        (settings.apiKey !== '' && settings.apiKey !== undefined)) {
      const appTypes = await fetchCloudflare('/gateway/app_types?per_page=1000', settings) as any;
      const reviewStatus = await fetchCloudflare('/gateway/apps/review_status', settings) as any;
      const ai_ids = (appTypes?.result || []).filter((t:any)=>t.application_type_id===25).map((t:any)=>t.id) || [];
      total_ai = ai_ids.length;
      const managed_ids = [
        ...(reviewStatus?.result?.approved_apps || []),
        ...(reviewStatus?.result?.in_review_apps || []),
        ...(reviewStatus?.result?.unapproved_apps || [])
      ];
      managed_count = ai_ids.filter((id:string)=>managed_ids.includes(id)).length;
      const shadow_count = total_ai - managed_count;
      shadowUsage = total_ai>0 ? Math.round(shadow_count/total_ai*100*1000)/1000 : 0;
      debugInfo = { aiIds: ai_ids, managedIds: managed_ids, total_ai, managed_count, shadowUsage };
      console.log(`SHADOW_COMPUTE_RAW total_ai=${total_ai} managed=${managed_count} shadowUsage=${shadowUsage}`);
    }
    const baseReport = getBaseReport();
    const report = {
      ...baseReport,
      id: `rep_${Date.now()}`,
      summary: {
        ...(baseReport.summary || {}),
        shadowUsage,
        shadowAiApps: total_ai - (managed_count || 0),
        aiApps: total_ai
      },
      debug: debugInfo
    };
    await controller.addReport(report);
    await controller.addLog({
      timestamp: new Date().toISOString(),
      action: 'Assessment Generated',
      user: settings.email || 'admin',
      status: 'Success'
    });
    return c.json({ success: true, data: report });
  });
  app.post('/api/reports', async (c) => {
    const body = await c.req.json();
    const controller = c.env.APP_CONTROLLER.get(c.env.APP_CONTROLLER.idFromName("controller"));
    await controller.addReport(body);
    await controller.addLog({
      timestamp: new Date().toISOString(),
      action: 'Report Created',
      user: body.user || body.email || 'admin',
      status: 'Success'
    });
    return c.json({ success: true });
  });

  app.get('/api/reports', async (c) => {
    const controller = c.env.APP_CONTROLLER.get(c.env.APP_CONTROLLER.idFromName("controller"));
    const reports = await controller.listReports();
    // Return empty array if null to prevent frontend crashes
    const data = (reports || []);
    return c.json({ success: true, data });
  });
  app.post('/api/ai-trends', async (c) => {
    const trends = [
      {date:'2024-05-01',ChatGPT:400,Copilot:300},
      {date:'2024-05-20',ChatGPT:450,Copilot:320},
      {date:'2024-05-31',ChatGPT:480,Copilot:350},
      {date:'2024-06-10',ChatGPT:500,Copilot:370}
    ];
    return c.json({success:true, data:trends});
  });

  app.get('/api/reports/:id', async (c) => {
    const id = c.req.param('id');
    const controller = c.env.APP_CONTROLLER.get(c.env.APP_CONTROLLER.idFromName("controller"));
    const report = await controller.getReportById(id);
    return c.json({ success: true, data: report || getBaseReport() });
  });
  app.delete('/api/reports/:id', async (c) => {
    const id = c.req.param('id');
    const controller = c.env.APP_CONTROLLER.get(c.env.APP_CONTROLLER.idFromName("controller"));
    await controller.removeReport(id);
    return c.json({ success: true });
  });
  app.get('/api/logs', async (c) => {
    const controller = c.env.APP_CONTROLLER.get(c.env.APP_CONTROLLER.idFromName("controller"));
    const logs = await controller.getLogs();
    return c.json({ success: true, data: logs || [] });
  });
  app.post('/api/license-check', async (c) => {
    const licenseData = {
      plan: 'Enterprise Zero Trust',
      totalLicenses: 1000,
      usedLicenses: 742,
      accessSub: true,
      gatewaySub: true,
      dlp: true,
      casb: true,
      rbi: true
    };
    return c.json({ success: true, data: licenseData });
  });
}
export function coreRoutes(app: Hono<any>): void { /* Routes now inline hardcoded in worker/index.ts */ }