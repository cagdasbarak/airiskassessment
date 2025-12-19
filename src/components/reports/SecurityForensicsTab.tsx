import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Activity, ShieldAlert, BarChart3, Globe, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { AssessmentReport } from '@/lib/api';
interface SecurityForensicsTabProps {
  report: AssessmentReport;
}
const COLORS = [
  'hsl(24, 95%, 53%)', // Orange
  'hsl(0, 84%, 60%)',  // Red
  'hsl(271, 91%, 65%)', // Purple
  'hsl(217, 91%, 60%)', // Blue
  'hsl(142, 71%, 45%)'  // Emerald
];
export function SecurityForensicsTab({ report }: SecurityForensicsTabProps) {
  const trendData = report.securityCharts?.topAppsTrends || [];
  // Extract keys for Area components, excluding 'date'
  const appKeys = trendData.length > 0 
    ? Object.keys(trendData[0]).filter(k => k !== 'date')
    : [];
  const chartConfig = appKeys.reduce((acc, key, idx) => {
    acc[key] = {
      label: key,
      color: COLORS[idx % COLORS.length]
    };
    return acc;
  }, {} as any);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <Card className="border-border/50 shadow-soft bg-white/40 dark:bg-black/20 backdrop-blur-xl overflow-hidden">
        <CardHeader className="border-b border-border/10 pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <Activity className="h-6 w-6 text-[#F38020]" />
                AI Adoption Velocity
              </CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                Unique daily user trends for Top 5 AI platforms (30-day lookback)
              </CardDescription>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#F38020]/10 border border-[#F38020]/20 text-[10px] font-black uppercase tracking-[0.2em] text-[#F38020]">
              Forensic Real-time
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="h-[450px] w-full">
            <ChartContainer config={chartConfig}>
              <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  {appKeys.map((key, idx) => (
                    <linearGradient key={`grad-${key}`} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700 }}
                  dx={-10}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
                {appKeys.map((key, idx) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stackId="1"
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill={`url(#grad-${key})`}
                    animationDuration={1500}
                  />
                ))}
              </AreaChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-border/50 shadow-soft bg-white/30 dark:bg-black/10 backdrop-blur-md overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-tight">Access Log Correlation</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground/60">Risk Vector distribution</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-48 flex flex-col items-center justify-center">
             <div className="w-full h-full border-2 border-dashed border-border/30 rounded-2xl flex flex-col items-center justify-center gap-4">
                <BarChart3 className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Visualizing Log Streams</p>
              </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-soft bg-white/30 dark:bg-black/10 backdrop-blur-md overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-tight">Geographic Origin</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground/60">Regional AI Traffic Density</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-48 flex flex-col items-center justify-center">
             <div className="w-full h-full border-2 border-dashed border-border/30 rounded-2xl flex flex-col items-center justify-center gap-4">
                <Globe className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Regional Compliance Check</p>
              </div>
          </CardContent>
        </Card>
      </div>
      <div className="p-6 rounded-[2rem] bg-[#F38020]/5 border border-[#F38020]/10 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white dark:bg-black/40 flex items-center justify-center shadow-sm">
            <Lock className="h-6 w-6 text-[#F38020]" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight">ZTNA Log Synchronization</h4>
            <p className="text-xs text-muted-foreground font-medium italic">Connected to Cloudflare Gateway API via riskguard-ai-agent-v1</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest">Active Tunnel</span>
        </div>
      </div>
    </motion.div>
  );
}