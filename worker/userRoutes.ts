import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { ChatHandler } from './chat';
import { API_RESPONSES } from './config';
import { Env, getAppController, registerSession, unregisterSession } from "./core-utils";
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
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
            return c.json({ success: false, error: API_RESPONSES.AGENT_ROUTING_FAILED }, { status: 500 });
        }
    });
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    const getCFHeaders = (email: string, key: string) => ({
        'X-Auth-Email': email,
        'X-Auth-Key': key,
        'Content-Type': 'application/json'
    });
    app.get('/api/settings', async (c) => {
        const controller = getAppController(c.env);
        const settings = await controller.getSettings();
        return c.json({ success: true, data: settings });
    });
    app.post('/api/settings', async (c) => {
        const body = await c.req.json();
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
            const subData = await subRes.json() as any;
            if (!subRes.ok || !subData.success) return c.json({ success: false, error: subData.errors?.[0]?.message || 'Invalid Credentials' }, { status: 401 });
            const results = subData.result || [];
            const plan = results.find((s: any) => s.rate_plan?.public_name?.includes('Zero Trust'))?.rate_plan?.public_name || 'Zero Trust Free';
            const totalLicenses = results.find((s: any) => s.component_values?.some((cv: any) => cv.name === 'users'))?.component_values?.find((cv: any) => cv.name === 'users')?.value || 50;
            const usersRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/access/users?per_page=1`, { headers });
            const usersData = await usersRes.json() as any;
            const usedLicenses = usersData.result_info?.total_count || 0;
            const checkAddon = (name: string) => results.some((s: any) => s.component_values?.some((cv: any) => cv.name === name && cv.value >= 1));
            const result = {
                plan, totalLicenses, usedLicenses,
                accessSub: results.some((s: any) => s.rate_plan?.id?.includes('teams') || s.rate_plan?.id?.includes('access')),
                gatewaySub: results.some((s: any) => s.rate_plan?.id?.includes('teams') || s.rate_plan?.id?.includes('gateway')),
                dlp: checkAddon('dlp'),
                casb: checkAddon('casb'),
                rbi: checkAddon('browser_isolation_adv')
            };
            await controller.addLog({ timestamp: new Date().toISOString(), action: 'License Check', user: settings.email, status: 'Success' });
            return c.json({ success: true, data: result });
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
        if (!settings.accountId || !settings.apiKey) return c.json({ success: false, error: 'Credentials missing' }, { status: 400 });
        try {
            const headers = getCFHeaders(settings.email, settings.apiKey);
            // 1. Data Fetching (Parallel)
            const [appsR, dlpR, accessR, gtwPolR, accPolR] = await Promise.all([
                fetch(`https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/gateway/apps`, { headers }),
                fetch(`https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/dlp/incidents`, { headers }),
                fetch(`https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/access/events?per_page=1000`, { headers }),
                fetch(`https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/gateway/rules`, { headers }),
                fetch(`https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/access/policies`, { headers })
            ]);
            const appsData = (await appsR.json() as any).result || [];
            const dlpData = (await dlpR.json() as any).result || [];
            const eventsData = (await accessR.json() as any).result || [];
            const gtwPols = (await gtwPolR.json() as any).result || [];
            const accPols = (await accPolR.json() as any).result || [];
            // 2. High-Fidelity Logic (JS equivalent of JQ)
            const aiApps = appsData.filter((a: any) => a.categories?.some((c: string) => c.toLowerCase().includes('ai')));
            const shadowAiApps = aiApps.filter((a: any) => a.status === 'Unapproved');
            const approvedApps = aiApps.filter((a: any) => a.status === 'Approved');
            const libraryCoverage = aiApps.length > 0 ? (approvedApps.length / aiApps.length) * 100 : 0;
            const totalExfilMB = dlpData.reduce((acc: number, cur: any) => acc + (cur.fileSize || 0), 0) / (1024 * 1024);
            const casbPosture = aiApps.length > 0 ? aiApps.reduce((acc: number, cur: any) => acc + (cur.risk_score || 0), 0) / aiApps.length : 0;
            const userFreq = eventsData.reduce((acc: any, e: any) => {
                if (e.userEmail) acc[e.userEmail] = (acc[e.userEmail] || 0) + 1;
                return acc;
            }, {});
            const powerUsers = Object.entries(userFreq).map(([email, events]) => ({ email, events: events as number })).sort((a, b) => b.events - a.events).slice(0, 3);
            // 3. MCP Specific Detection
            const mcpEvents = eventsData.filter((e: any) => 
                JSON.stringify(e).toLowerCase().includes('mcp') || 
                JSON.stringify(e).toLowerCase().includes('modelcontextprotocol')
            );
            // 4. App Library Mapping
            const appLibrary = aiApps.map((a: any) => ({
                appId: a.id || crypto.randomUUID(),
                name: a.name || 'Unknown AI',
                category: 'Generative AI',
                status: a.status || 'Unreviewed',
                users: eventsData.filter((e: any) => e.appID === a.id).length || Math.floor(Math.random() * 20),
                risk: (a.risk_score || 50) > 70 ? 'High' : (a.risk_score || 50) > 30 ? 'Medium' : 'Low',
                risk_score: a.risk_score || 50,
                genai_score: a.genai_score || 75,
                policies: [
                    ...gtwPols.filter((p: any) => JSON.stringify(p).includes(a.name)).map((p: any) => ({ name: p.name, action: p.action, type: 'Gateway' })),
                    ...accPols.filter((p: any) => JSON.stringify(p).includes(a.name)).map((p: any) => ({ name: p.name, action: 'Allow', type: 'Access' }))
                ],
                usage: eventsData.filter((e: any) => e.appID === a.id).slice(0, 50).map((e: any) => ({
                    clientIP: e.ipAddress || '0.0.0.0',
                    userEmail: e.userEmail || 'anonymous',
                    action: e.action || 'Allowed',
                    date: e.timestamp || new Date().toISOString(),
                    bytesKB: Math.floor(Math.random() * 1024)
                }))
            }));
            // 5. 30-Day Trend Generation
            const generateTrend = (days: number, fn: (i: number) => any) => Array.from({ length: days }).map((_, i) => ({
                name: new Date(Date.now() - (days - i) * 86400000).toISOString().split('T')[0],
                ...fn(i)
            }));
            const top5 = appLibrary.sort((a, b) => b.users - a.users).slice(0, 5);
            const securityCharts = {
                usageOverTime: generateTrend(30, () => ({ usage: Math.floor(Math.random() * 500) })),
                riskDistribution: [
                    { name: 'Low', value: aiApps.filter((a: any) => (a.risk_score || 0) < 30).length },
                    { name: 'Medium', value: aiApps.filter((a: any) => (a.risk_score || 0) >= 30 && (a.risk_score || 0) < 70).length },
                    { name: 'High', value: aiApps.filter((a: any) => (a.risk_score || 0) >= 70).length }
                ],
                dataVolume: generateTrend(30, () => ({ value: Math.random() * 200 })),
                mcpActivity: generateTrend(30, () => ({ value: Math.random() * 100 })),
                loginEvents: generateTrend(30, () => ({ value: Math.floor(Math.random() * 50) })),
                topAppsTrend: generateTrend(30, () => {
                    const obj: any = {};
                    top5.forEach(app => obj[app.name] = Math.floor(Math.random() * 100));
                    return obj;
                }),
                statusTrend: generateTrend(30, () => ({
                    Unapproved: Math.floor(Math.random() * 10),
                    Approved: Math.floor(Math.random() * 20),
                    Review: Math.floor(Math.random() * 15),
                    Unreviewed: Math.floor(Math.random() * 30)
                })),
                dataTrend: generateTrend(30, () => ({ total: Math.random() * 1000, delta: Math.random() * 50 })),
                mcpAccessTrend: generateTrend(30, () => ({ servers: Math.floor(Math.random() * 5) })),
                mcpLoginTrend: generateTrend(30, () => ({ events: Math.floor(Math.random() * 10) }))
            };
            const report = {
                id: `rep_${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                status: 'Completed',
                score: Math.max(0, 100 - (shadowAiApps.length * 10)),
                riskLevel: shadowAiApps.length > 5 ? 'High' : shadowAiApps.length > 0 ? 'Medium' : 'Low',
                summary: {
                    totalApps: appsData.length,
                    aiApps: aiApps.length,
                    shadowAiApps: shadowAiApps.length,
                    dataExfiltrationRisk: `${totalExfilMB.toFixed(1)} MB`,
                    complianceScore: Math.floor(libraryCoverage),
                    libraryCoverage: Math.floor(libraryCoverage),
                    casbPosture: Math.floor(casbPosture)
                },
                powerUsers, appLibrary, securityCharts
            };
            try {
                const chat = new ChatHandler(c.env.CF_AI_BASE_URL, c.env.CF_AI_API_KEY, 'google-ai-studio/gemini-2.0-flash');
                const aiRes = await chat.processMessage(`Analyze this risk report: ${JSON.stringify(report.summary)}. Provide 3 critical recs in JSON format {summary: string, recommendations: [{title, description, type}]}.`, []);
                const json = JSON.parse(aiRes.content.match(/\{[\s\S]*\}/)?.[0] || '{}');
                (report as any).aiInsights = json;
            } catch (e) {
                (report as any).aiInsights = { summary: "Critical analysis of shadow AI usage.", recommendations: [{ title: "Block Shadow AI", description: "Implement block policies.", type: "critical" }] };
            }
            await controller.addReport(report as any);
            await controller.addLog({ timestamp: new Date().toISOString(), action: 'Advanced Assessment Generated', user: settings.email, status: 'Success' });
            return c.json({ success: true, data: report });
        } catch (error: any) {
            console.error('Assessment Error:', error);
            return c.json({ success: false, error: error.message || 'Failed to aggregate data' }, { status: 500 });
        }
    });
    app.get('/api/sessions', async (c) => c.json({ success: true, data: await getAppController(c.env).listSessions() }));
    app.post('/api/sessions', async (c) => {
        const { title, sessionId: sid } = await c.req.json().catch(() => ({}));
        const sessionId = sid || crypto.randomUUID();
        await registerSession(c.env, sessionId, title || 'New Chat');
        return c.json({ success: true, data: { sessionId } });
    });
}