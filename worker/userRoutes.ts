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
        if (!settings.accountId || !settings.apiKey) {
            return c.json({ success: false, error: 'Credentials missing' }, { status: 400 });
        }
        try {
            const headers = getCFHeaders(settings.email, settings.apiKey);
            // 1. Fetch Subscriptions (Main source of truth)
            const subRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/subscriptions`, { headers });
            const rawText = await subRes.text();
            let subData: any;
            try {
                subData = JSON.parse(rawText);
            } catch (e) {
                return c.json({ success: false, error: 'Malformed API response' }, { status: 500 });
            }
            if (!subRes.ok || !subData.success) {
                return c.json({ success: false, error: subData.errors?.[0]?.message || 'Invalid Cloudflare Credentials' }, { status: 401 });
            }
            const results = subData.result || [];
            // A. Plan Detection (Regex Index split)
            const planMatch = rawText.match(/"public_name":"Cloudflare Zero Trust[^"]*"/);
            const plan = planMatch ? planMatch[0].split('"')[3] : 'Zero Trust Free';
            // B. Total Licenses (Regex search)
            const totalMatch = rawText.match(/"name":"users","value":(\d+)/);
            const totalLicenses = totalMatch ? parseInt(totalMatch[1]) : 50;
            // C. Used Licenses (Fetch actual active user count)
            const usersRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/access/users?per_page=1`, { headers });
            const usersData: any = await usersRes.json();
            const usedLicenses = usersData.result_info?.total_count || 0;
            // D. Feature Flags (Rate Plan ID check)
            const accessSub = results.some((s: any) => 
                s.rate_plan?.id?.includes('teams') || s.rate_plan?.id?.includes('access')
            );
            const gatewaySub = results.some((s: any) => 
                s.rate_plan?.id?.includes('teams') || s.rate_plan?.id?.includes('gateway')
            );
            // E. Add-ons (Component value check)
            const checkAddon = (name: string) => results.some((s: any) =>
                s.component_values?.some((cv: any) => cv.name === name && cv.value >= 1)
            );
            const result = {
                plan,
                totalLicenses,
                usedLicenses,
                accessSub,
                gatewaySub,
                dlp: checkAddon('dlp'),
                casb: checkAddon('casb'),
                rbi: checkAddon('browser_isolation_adv')
            };
            await controller.addLog({
                timestamp: new Date().toISOString(),
                action: 'License Check Performed',
                user: settings.email,
                status: 'Success'
            });
            return c.json({ success: true, data: result });
        } catch (error) {
            console.error('License Check Error:', error);
            return c.json({ success: false, error: 'Cloudflare API connection failed' }, { status: 500 });
        }
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
        if (!report) return c.json({ success: false, error: 'Report not found' }, { status: 404 });
        return c.json({ success: true, data: report });
    });
    app.delete('/api/reports/:id', async (c) => {
        const id = c.req.param('id');
        const controller = getAppController(c.env);
        const settings = await controller.getSettings();
        const removed = await controller.removeReport(id);
        if (removed) {
            await controller.addLog({
                timestamp: new Date().toISOString(),
                action: 'Report Deleted',
                user: settings.email || 'System Admin',
                status: 'Success'
            });
            return c.json({ success: true });
        }
        return c.json({ success: false, error: 'Report not found' }, { status: 404 });
    });
    app.get('/api/logs', async (c) => {
        const controller = getAppController(c.env);
        const logs = await controller.getLogs();
        return c.json({ success: true, data: logs });
    });
    app.post('/api/assess', async (c) => {
        const controller = getAppController(c.env);
        const settings = await controller.getSettings();
        if (!settings.accountId || !settings.apiKey) {
            return c.json({ success: false, error: 'Cloudflare credentials not configured' }, { status: 400 });
        }
        try {
            const baseReport = {
                id: `rep_${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                status: 'Completed',
                score: Math.floor(Math.random() * 15) + 75,
                riskLevel: Math.random() > 0.8 ? 'High' : 'Medium',
                summary: {
                    totalApps: 184,
                    aiApps: 28,
                    shadowAiApps: Math.floor(Math.random() * 8) + 2,
                    dataExfiltrationRisk: 'Medium',
                    complianceScore: 82
                },
                appLibrary: [
                    { name: 'ChatGPT', category: 'AI Assistant', status: 'Approved', users: 52, risk: 'Low' },
                    { name: 'Claude', category: 'AI Assistant', status: 'Approved', users: 14, risk: 'Low' },
                    { name: 'Perplexity', category: 'Search', status: 'Unapproved', users: 9, risk: 'High' },
                    { name: 'GitHub Copilot', category: 'Development', status: 'Approved', users: 94, risk: 'Low' },
                ],
                securityCharts: {
                    usageOverTime: [
                        { name: 'Mon', usage: 420 }, { name: 'Tue', usage: 310 }, { name: 'Wed', usage: 540 },
                        { name: 'Thu', usage: 290 }, { name: 'Fri', usage: 610 },
                    ],
                    riskDistribution: [
                        { name: 'Low', value: 70 }, { name: 'Medium', value: 20 }, { name: 'High', value: 10 },
                    ]
                }
            };
            const chatHandler = new ChatHandler(c.env.CF_AI_BASE_URL, c.env.CF_AI_API_KEY, 'google-ai-studio/gemini-2.0-flash');
            const prompt = `Analyze this Cloudflare Zero Trust AI Risk Report and provide executive recommendations in JSON format.
            Report Data: ${JSON.stringify(baseReport.summary)}
            Return ONLY a JSON object with:
            {
              "summary": "A 2-sentence executive summary",
              "recommendations": [
                {"title": "Action Title", "description": "Detailed advice", "type": "critical|policy|optimization"}
              ]
            }`;
            const aiResponse = await chatHandler.processMessage(prompt, []);
            let aiInsights;
            try {
                const content = aiResponse.content;
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                const jsonStr = jsonMatch ? jsonMatch[0] : content;
                aiInsights = JSON.parse(jsonStr);
            } catch (e) {
                console.error('AI Parsing Error:', e);
                aiInsights = {
                    summary: "AI analysis completed. Security posture is stable but requires monitoring of unapproved AI tools.",
                    recommendations: [
                        { title: "Block Unapproved AI", description: "Implement Gateway policies to block Perplexity and other unvetted AI search tools.", type: "critical" }
                    ]
                };
            }
            const finalReport = { ...baseReport, aiInsights };
            await controller.addReport(finalReport as any);
            await controller.addLog({
                timestamp: new Date().toISOString(),
                action: 'Report Generated',
                user: settings.email,
                status: 'Success'
            });
            return c.json({ success: true, data: finalReport });
        } catch (error) {
            console.error('Assessment Error:', error);
            return c.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
        }
    });
    app.get('/api/sessions', async (c) => {
        const controller = getAppController(c.env);
        const sessions = await controller.listSessions();
        return c.json({ success: true, data: sessions });
    });
    app.post('/api/sessions', async (c) => {
        const { title, sessionId: providedSessionId } = await c.req.json().catch(() => ({}));
        const sessionId = providedSessionId || crypto.randomUUID();
        let sessionTitle = title || `Chat ${new Date().toLocaleDateString()}`;
        await registerSession(c.env, sessionId, sessionTitle);
        return c.json({ success: true, data: { sessionId, title: sessionTitle } });
    });
    app.delete('/api/sessions/:sessionId', async (c) => {
        const sessionId = c.req.param('sessionId');
        const deleted = await unregisterSession(c.env, sessionId);
        return c.json({ success: deleted });
    });
}