import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Activity, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { AssessmentReport } from '@/lib/api';
interface SecurityForensicsTabProps {
  report: AssessmentReport;
}
// Exact HSL Mapping as per requirements
const STATUS_COLORS: Record<string, string> = {
  'Unreviewed': 'hsl(0, 0%, 50%)',
  'Review': 'hsl(45, 100%, 70%)',
  'Unapproved': 'hsl(0, 100%, 60%)',
  'Approved': 'hsl(142, 71%, 45%)'
};
const FALLBACK_COLORS = [
  'hsl(24, 95%, 53%)',
  'hsl(217, 91%, 60%)',
  'hsl(271, 91%, 65%)',
  'hsl(189, 94%, 43%)',
  'hsl(142, 71%, 45%)'
];
export function SecurityForensicsTab({ report }: SecurityForensicsTabProps) {
  const trendData = report.securityCharts?.topAppsTrends || [];
  // Extract keys for Area components, excluding 'date'
  const appKeys = trendData.length > 0
    ? Object.keys(trendData[0]).filter(k => k !== 'date')
    : [];
  const chartConfig = appKeys.reduce((acc, key, idx) => {
    // Try to map status based color if the key contains status info, else use fallback
    const color = STATUS_COLORS[key] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
    acc[key] = {
      label: key,
      color: color
    };
    return acc;
  }, {} as any);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-0 h-full min-h-[600px] flex flex-col"
    >
      <Card className="flex-1 border-border/50 shadow-soft bg-white/40 dark:bg-black/20 backdrop-blur-xl overflow-hidden flex flex-col">
        <CardHeader className="border-b border-border/10 pb-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
                <Activity className="h-8 w-8 text-[#F38020]" />
                AI Adoption Velocity
              </CardTitle>
              <CardDescription className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                Executive Forensic Analysis: Unique Daily Users (30-Day Lookback)
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#F38020]/10 border border-[#F38020]/20">
              <ShieldCheck className="h-4 w-4 text-[#F38020]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#F38020]">Precision Audit</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-8 min-h-[500px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <defs>
                {appKeys.map((key, idx) => {
                  const color = STATUS_COLORS[key] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
                  return (
                    <linearGradient key={`grad-${key}`} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono' }}
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
                dy={10}
                angle={-45}
                textAnchor="end"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono' }}
                dx={-10}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                iconType="circle"
                wrapperStyle={{ 
                  paddingLeft: '40px', 
                  fontSize: '11px', 
                  fontWeight: 900, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.1em' 
                }}
              />
              {appKeys.map((key, idx) => {
                const color = STATUS_COLORS[key] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
                return (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stackId="1"
                    stroke={color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#grad-${key})`}
                    animationDuration={1500}
                  />
                );
              })}
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}