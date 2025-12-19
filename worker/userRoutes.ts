import { Hono } from "hono";
console.log('[RISKGUARD] Initializing PRECISION SHADOW AI Architecture...');
let userRoutesRegistered = false;
async function fetchCloudflare(endpoint: string, settings: any) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${settings.accountId}${endpoint}`;
  
  // Mock data for sandbox demo
  if (endpoint.includes('/gateway/app_types')) {
    const mockData = {
      result: Array.from({length:600}, (_,i)=>({
        id:`app_${i}`, 
        application_type_id: i<532 ? 25 : Math.floor(Math.random()*24)+1
      }))
    };
    console.log('[RAW_APP_TYPES]', {totalApps: 600, aiCount:532});
    return mockData;
  }
  if (endpoint.includes('/gateway/apps/review_status')) {
    const mockData = {
      result: {
        approved_apps:Array.from({length:5},(_,i)=>`app_${i}`),
        in_review_apps:Array.from({length:2},(_,i)=>`app_${5+i}`),
        unapproved_apps:Array.from({length:3},(_,i)=>`app_${7+i}`)
      }
    };
    console.log('[RAW_REVIEW_STATUS]', mockData.result);
    return mockData;
  }
  if (endpoint.includes('/gateway/proxy/entitlements')) {
    const mockData = {result:{plan:'Enterprise Zero Trust'}};
    console.log('[RAW_ENTITLEMENTS]', mockData);
    return mockData;
  }
  
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
    return await res.json();
  } catch (err) {
    console.error(`[CF_FETCH_EXCEPTION] ${endpoint}:`, err);
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
    console.log('[ASSESS_SETTINGS]', {
      accountId:settings.accountId !== '' && settings.accountId !== undefined,
      email:settings.email !== '' && settings.email !== undefined,
      apiKey:settings.apiKey !== '' && settings.apiKey !== undefined ? 'LOADED':'MISSING'
    });
    let shadowUsage = 0;
    let total_ai = 0;
    let managed_count = 0;
    let debugInfo: any = { aiIds: [], managedIds: [] };
    if ((settings.accountId !== '' && settings.accountId !== undefined) && 
        (settings.apiKey !== '' && settings.apiKey !== undefined)) {
      // Cast to any to resolve TS2339 result property error
      const appTypes = await fetchCloudflare('/gateway/app_types?per_page=1000', settings) as any;
      const reviewStatus = await fetchCloudflare('/gateway/apps/review_status', settings) as any;
      if (appTypes?.result && reviewStatus?.result) {
        const ai_ids = appTypes.result
          .filter((t: any) => t.application_type_id === 25)
          .map((t: any) => t.id);
        total_ai = ai_ids.length;
        const managed_ids = [
          ...(reviewStatus.result.approved_apps || []),
          ...(reviewStatus.result.in_review_apps || []),
          ...(reviewStatus.result.unapproved_apps || [])
        ];
        managed_count = ai_ids.filter((id: string) => managed_ids.includes(id)).length;
        const shadow_count = total_ai - managed_count;
        shadowUsage = total_ai > 0 ? Math.round((shadow_count / total_ai) * 100 * 1000) / 1000 : 0;
        debugInfo = { aiIds: ai_ids, managedIds: managed_ids, total_ai, managed_count, shadowUsage };
      }
    }
    const report = {
      ...getBaseReport(),
      id: `rep_${Date.now()}`,
      summary: {
        ...getBaseReport().summary,
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
  app.get('/api/reports', async (c) => {
    const controller = c.env.APP_CONTROLLER.get(c.env.APP_CONTROLLER.idFromName("controller"));
    const reports = await controller.listReports();
    // Return empty array if null to prevent frontend crashes
    const data = (reports || []);
    return c.json({ success: true, data });
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
    const controller = c.env.APP_CONTROLLER.get(c.env.APP_CONTROLLER.idFromName("controller"));
    const settings = await controller.getSettings();
    const licenseResult = await fetchCloudflare('/gateway/proxy/entitlements', settings) as any;
    const mockLicense = {
      plan: settings.accountId ? (licenseResult?.result?.plan || 'Enterprise Zero Trust') : 'Free Tier',
      totalLicenses: 1000,
      usedLicenses: 742,
      accessSub: settings.accountId !== '' && settings.accountId !== undefined,
      gatewaySub: settings.accountId !== '' && settings.accountId !== undefined,
      dlp: true,
      casb: true,
      rbi: true
    };
    return c.json({ success: true, data: mockLicense });
  });
}
export function coreRoutes(app: Hono<any>): void {}