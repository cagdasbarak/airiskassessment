import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
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
    // Settings Endpoints
    app.get('/api/settings', async (c) => {
        const controller = getAppController(c.env);
        const settings = await controller.getSettings();
        return c.json({ success: true, data: settings });
    });
    app.post('/api/settings', async (c) => {
        const body = await c.req.json();
        const controller = getAppController(c.env);
        await controller.updateSettings(body);
        return c.json({ success: true });
    });
    // Reports Endpoints
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
    // Assessment Trigger
    app.post('/api/assess', async (c) => {
        const controller = getAppController(c.env);
        const settings = await controller.getSettings();
        if (!settings.accountId || !settings.apiKey) {
            return c.json({ success: false, error: 'Cloudflare credentials not configured' }, { status: 400 });
        }
        // Simulate data aggregation logic
        const newReport = {
            id: `rep_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            status: 'Completed',
            score: Math.floor(Math.random() * 20) + 70,
            riskLevel: Math.random() > 0.7 ? 'High' : 'Medium',
            summary: {
                totalApps: 150 + Math.floor(Math.random() * 50),
                aiApps: 20 + Math.floor(Math.random() * 10),
                shadowAiApps: Math.floor(Math.random() * 12),
                dataExfiltrationRisk: 'High',
                complianceScore: 80 + Math.floor(Math.random() * 15)
            },
            appLibrary: [
                { name: 'ChatGPT', category: 'AI Assistant', status: 'Approved', users: 45, risk: 'Low' },
                { name: 'Claude', category: 'AI Assistant', status: 'Pending', users: 12, risk: 'Medium' },
                { name: 'Midjourney', category: 'Image Gen', status: 'Unapproved', users: 5, risk: 'High' },
                { name: 'GitHub Copilot', category: 'Development', status: 'Approved', users: 88, risk: 'Low' },
            ],
            securityCharts: {
                usageOverTime: [
                    { name: 'Mon', usage: 400 }, { name: 'Tue', usage: 300 }, { name: 'Wed', usage: 500 },
                    { name: 'Thu', usage: 280 }, { name: 'Fri', usage: 590 },
                ],
                riskDistribution: [
                    { name: 'Low', value: 60 }, { name: 'Medium', value: 25 }, { name: 'High', value: 15 },
                ]
            }
        };
        await controller.addReport(newReport as any);
        return c.json({ success: true, data: newReport });
    });
    // Session Management
    app.get('/api/sessions', async (c) => {
        const controller = getAppController(c.env);
        const sessions = await controller.listSessions();
        return c.json({ success: true, data: sessions });
    });
    app.post('/api/sessions', async (c) => {
        const { title, sessionId: providedSessionId, firstMessage } = await c.req.json().catch(() => ({}));
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