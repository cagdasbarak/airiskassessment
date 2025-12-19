import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { Env, getAppController, registerSession } from "./core-utils";
import { ChatHandler } from './chat';
import type { AssessmentReport, AIInsights, PowerUser } from './app-controller';

console.log('SAFE_LOAD: userRoutes imported success');

let coreRoutesRegistered = false;
let userRoutesRegistered = false;

const safeJSON = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
};

const cleanAIResponse = (text: string): string => {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '');
  }
  return cleaned.trim();
};

const safeFetch = async (endpoint: string, settings: any) => {
  const { accountId, email, apiKey } = settings;
  const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}`;
  return fetch(`${baseUrl}${endpoint}`, {
    headers: {
      'X-Auth-Email': email,
      'X-Auth-Key': apiKey,
      'Content-Type': 'application/json',
    },
  });
};

const formatRiskVolume = (kb: number): string => {
  if (kb <= 0) return "0 KB";
  if (kb < 1024) return `${kb.toLocaleString()} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
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
    if (!settings.accountId || !settings.apiKey) {
      return c.json({ success: false, error: 'Credentials required for license check' }, { status: 400 });
    }
    try {
      const subResp = await safeFetch('/subscriptions', settings);
      const subJson = safeJSON(await subResp.text());
      const subs = subJson?.result || [];

      // Find Zero Trust subscription and extract plan name
      const ztSub = subs.find((s: any) =>
        s.metadata?.plan_name?.includes('Zero Trust') ||
        s.component_values?.some((cv: any) => cv.name === 'zero_trust')
      );
      const planName = ztSub?.metadata?.public_name || 'Unknown Plan';

      // License capacity (users)
      let licenseCapacity = 0;
      subs.forEach((s: any) => {
        s.component_values?.forEach((cv: any) => {
          if (cv.name === 'users') licenseCapacity = Math.max(licenseCapacity, parseInt(cv.value || '0'));
        });
      });

      // Active users count
      const usersResp = await safeFetch('/access/users?per_page=1', settings);
      const usersJson = safeJSON(await usersResp.text());
      const activeUsers = usersJson?.result_info?.total_count || 0;

      // Feature flags
      const hasDLP = subs.some((s: any) =>
        s.component_values?.some((cv: any) => cv.name === 'dlp' && parseInt(cv.value) === 1)
      );
      const hasCASB = subs.some((s: any) =>
        s.component_values?.some((cv: any) => cv.name === 'casb' && parseInt(cv.value) === 1)
      );
      const hasRBI = subs.some((s: any) =>
        s.component_values?.some((cv: any) => cv.name === 'browser_isolation_adv' && parseInt(cv.value) === 1)
      );

      const licenseData = {
        planName,
        licenseCapacity,
        activeUsers,
        dlpStatus: hasDLP ? 'VAR' : 'YOK',
        casbStatus: hasCASB ? 'VAR' : 'YOK',
        rbiStatus: hasRBI ? 'VAR' : 'YOK',
        usagePercentage: licenseCapacity > 0 ? Math.round((activeUsers / licenseCapacity) * 100) : 0
      };

      await controller.addLog({
        timestamp: new Date().toISOString(),
        action: 'License Check Performed',
        user: settings.email || 'System',
        status: 'Success',
        details: `Plan: ${planName}, Active: ${activeUsers}/${licenseCapacity}`
      });

      return c.json({ success: true, data: licenseData });
    } catch (error) {
      console.error('License check failed:', error);
      await controller.addLog({
        timestamp: new Date().toISOString(),
        action: 'License Check Failed',
        user: settings.email || 'System',
        status: 'Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      return c.json({ success: false, error: 'License check failed' }, { status: 500 });
    }
  });
}
//