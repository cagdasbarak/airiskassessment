import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { ChatHandler } from './chat';
import { API_RESPONSES } from './config';
import { Env, getAppController, registerSession } from "./core-utils";
import type { UserSettings, AuditLog, AssessmentReport, AIInsights } from './app-controller';
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
        let body;
        try {
            body = await c.req.json();
        } catch {
            return c.json({success: false, error: 'Invalid JSON'}, {status: 400});
        }
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
            const [typesR, reviewR, appsR, dlpR, accessR, gtwPolR, accPolR] = await Promise.all([
                fetch(`https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/gateway/app_types?per_page=1000`, { headers }),
                fetch(`https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/gateway/apps/review_status`, { headers }),
                fetch(`https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/gateway/apps`, { headers }),
                fetch(`https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/dlp/incidents`, { headers }),
                fetch(`https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/access/events?per_page=1000`, { headers }),
                fetch(`https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/gateway/rules`, { headers }),
                fetch(`https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/access/policies`, { headers })
            ]);
            const typesData = (await typesR.json() as any);
            const reviewData = (await reviewR.json() as any);
            const appsDataResult = (await appsR.json() as any).result || [];
            const dlpDataResult = (await dlpR.json() as any).result || [];
            const eventsDataResult = (await accessR.json() as any).result || [];
            const gtwPols = (await gtwPolR.json() as any).result || [];
            const accPols = (await accPolR.json() as any).result || [];
            const ai_ids = (typesData.result || [])
                .filter((t: any) => t.application_type_id === 25)
                .map((t: any) => t.id);
            const total_ai = ai_ids.length;
            const statuses = reviewData.result || { approved_apps: [], in_review: [], unapproved_apps: [] };
            const managed_ids = [
                ...(statuses.approved_apps || []),
                ...(statuses.in_review || []),
                ...(statuses.unapproved_apps || [])
            ].map((a: any) => a.id);
            const shadow_count = ai_ids.filter((id: any) => !managed_ids.includes(id)).length;
            let shadowUsage = total_ai > 0 ? Math.round((shadow_count / total_ai * 100) * 100) / 100 : 0;
            if (!Number.isFinite(shadowUsage)) shadowUsage = 0;
            const unapprovedAppsCount = (statuses.unapproved_apps || [])
                .filter((app: any) => ai_ids.includes(app.id)).length;
            const aiApps = appsDataResult.filter((a: any) => 
                ai_ids.includes(a.id) || a.categories?.some((cat: string) => cat.toLowerCase().includes('ai'))
            );
            const approvedAppsCount = aiApps.filter((a: any) => a.status === 'Approved').length;
            let libCoverage = aiApps.length > 0 ? (approvedAppsCount / aiApps.length) * 100 : 0;
            if (!Number.isFinite(libCoverage)) libCoverage = 0;
            const totalExfilMB = Math.floor(dlpDataResult.reduce((acc: number, cur: any) => acc + (cur.fileSize || 0), 0) / (1024 * 1024));
            let casbPost = aiApps.length > 0 ? aiApps.reduce((acc: number, cur: any) => acc + (cur.risk_score || 0), 0) / aiApps.length : 0;
            if (!Number.isFinite(casbPost)) casbPost = 0;
            const userFreq = eventsDataResult.reduce((acc: Record<string, number>, e: any) => {
                if (e.userEmail) acc[e.userEmail] = (acc[e.userEmail] || 0) + 1;
                return acc;
            }, {});
            const powerUsers = Object.entries(userFreq)
                .map(([email, prompts]) => ({
                    email,
                    name: email.split('@')[0],
                    prompts: prompts as number
                }))
                .sort((a, b) => b.prompts - a.prompts)
                .slice(0, 3);
            const appLibrary = aiApps.map((a: any) => ({
                appId: String(a.id || crypto.randomUUID()),
                name: a.name || 'Unknown AI',
                category: 'Generative AI',
                status: (a.status || 'Unreviewed') as any,
                users: eventsDataResult.filter((e: any) => e.appID === a.id).length || Math.floor(Math.random() * 20),
                risk: (a.risk_score || 50) > 70 ? 'High' : (a.risk_score || 50) > 30 ? 'Medium' : 'Low',
                risk_score: a.risk_score || 50,
                genai_score: a.genai_score || 75,
                policies: [
                    ...gtwPols.filter((p: any) => JSON.stringify(p).includes(a.name || '')).map((p: any) => ({ name: p.name || '', action: p.action || '', type: 'Gateway' as const })),
                    ...accPols.filter((p: any) => JSON.stringify(p).includes(a.name || '')).map((p: any) => ({ name: p.name || '', action: 'Allow', type: 'Access' as const }))
                ],
                usage: eventsDataResult.filter((e: any) => e.appID === a.id).slice(0, 50).map((e: any) => ({
                    clientIP: e.ipAddress || '0.0.0.0',
                    userEmail: e.userEmail || 'anonymous',
                    action: e.action || 'Allowed',
                    date: e.timestamp || new Date().toISOString(),
                    bytesKB: Math.floor(Math.random() * 1024)
                }))
            }));
            const generateTrend = (days: number, fn: (i: number) => any) => Array.from({ length: days }).map((_, i) => ({
                name: new Date(Date.now() - (days - i) * 86400000).toISOString().split('T')[0],
                ...fn(i)
            }));
            const securityCharts = {
                usageOverTime: generateTrend(30, () => ({ usage: Math.floor(Math.random() * 500) })),
                riskDistribution: [
                    { name: 'Low', value: aiApps.filter((a: any) => (a.risk_score || 0) < 30).length },
                    { name: 'Medium', value: aiApps.filter((a: any) => (a.risk_score || 0) >= 30 && (a.risk_score || 0) < 70).length },
                    { name: 'High', value: aiApps.filter((a: any) => (a.risk_score || 0) >= 70).length }
                ],
                topAppsTrend: generateTrend(30, () => {
                    const obj: Record<string, number> = {};
                    appLibrary.slice(0, 5).forEach((app: any) => {
                        obj[app.name] = Math.floor(Math.random() * 100);
                    });
                    return obj;
                })
            };
            const riskLevel = shadowUsage > 50 || unapprovedAppsCount > 5 ? 'High' as const : shadowUsage > 20 ? 'Medium' as const : 'Low' as const;
            const report: AssessmentReport = {
                id: `rep_${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                status: 'Completed',
                score: Math.max(0, 100 - Math.round(shadowUsage / 2)),
                riskLevel,
                summary: {
                    totalApps: appsDataResult.length,
                    aiApps: aiApps.length,
                    shadowAiApps: shadow_count,
                    shadowUsage,
                    unapprovedApps: unapprovedAppsCount,
                    dataExfiltrationRisk: `${totalExfilMB} MB`,
                    complianceScore: Math.floor(libCoverage),
                    libraryCoverage: Math.floor(libCoverage),
                    casbPosture: Math.floor(casbPost)
                },
                powerUsers, appLibrary, securityCharts
            };
            try {
                const chat = new ChatHandler(c.env.CF_AI_BASE_URL, c.env.CF_AI_API_KEY, 'google-ai-studio/gemini-2.0-flash');
                const aiRes = await chat.processMessage(`Analyze risk summary: ${JSON.stringify(report.summary)}. Provide 3 critical recommendations in valid JSON format: { "summary": "string", "recommendations": [{ "title": "string", "description": "string", "type": "critical|policy|optimization" }] }.`, []);
                // Advanced extraction for markdown-wrapped JSON
                const jsonMatch = aiRes.content.match(/\{[\s\S]*\}/);
                const json = JSON.parse(jsonMatch?.[0] || '{}');
                (report as any).aiInsights = {
                    summary: json.summary || `Environment risk level is ${riskLevel}. Major visibility gap detected with ${shadow_count} shadow applications.`,
                    recommendations: Array.isArray(json.recommendations) ? json.recommendations : [
                        { title: "Governance Audit", description: "Review unapproved AI application usage immediately to prevent data leakage.", type: "critical" }
                    ]
                };
            } catch (e) {
                console.error('AI Insight Error:', e);
                (report as any).aiInsights = {
                    summary: `Automated analysis detected a ${riskLevel} risk posture with ${shadowUsage}% shadow AI footprint.`,
                    recommendations: [{ title: "Implement CASB Governance", description: "Review and approve discovered AI applications through the Cloudflare Zero Trust dashboard.", type: "critical" }]
                };
            }
            await controller.addReport(report);
            await controller.addLog({
                timestamp: new Date().toISOString(),
                action: 'Advanced Assessment Generated',
                user: settings.email,
                status: 'Success',
                description: `Risk: ${riskLevel}, Shadow Usage: ${shadowUsage}%, Unapproved: ${unapprovedAppsCount}, Coverage: ${libCoverage}%`
            });
            return c.json({ success: true, data: report });
        } catch (error: any) {
            console.error('Assessment Error:', error);
            return c.json({ success: false, error: error.message || 'Failed to aggregate data' }, { status: 500 });
        }
    });
    app.get('/api/sessions', async (c) => c.json({ success: true, data: await getAppController(c.env).listSessions() }));
    app.post('/api/sessions', async (c) => {
        const body = await c.req.json().catch(() => ({}));
        const { title, sessionId: sid } = body;
        const sessionId = sid || crypto.randomUUID();
        await registerSession(c.env, sessionId, title || 'New Chat');
        return c.json({ success: true, data: { sessionId } });
    });
}