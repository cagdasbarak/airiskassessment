import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { motion } from 'framer-motion';
import { AssessmentReport } from '@/lib/api';
interface SecurityForensicsTabProps {
  report: AssessmentReport;
}
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
  const appKeys = trendData.length > 0
    ? Object.keys(trendData[0]).filter(k => k !== 'date')
    : [];
  const chartConfig = appKeys.reduce((acc, key, idx) => {
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
        <CardHeader className="border-b border-border/10 pb-6 flex-shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black tracking-tight text-foreground">
              Top 5 Visited AI Applications
            </CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
              Aggregated User Count • Last 30 Days
            </CardDescription>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-tighter hidden md:block">
            Data Source: Cloudflare Access Forensics
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-4 md:p-8 min-h-[500px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart 
              data={trendData} 
              margin={{ top: 20, right: 140, left: 10, bottom: 40 }}
            >
              <defs>
                {appKeys.map((key, idx) => {
                  const color = STATUS_COLORS[key] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
                  return (
                    <linearGradient key={`grad-${key}`} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono', fill: 'currentColor' }}
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
                dy={15}
                angle={-45}
                textAnchor="end"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono', fill: 'currentColor' }}
                dx={-5}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend
                verticalAlign="top"
                align="right"
                layout="vertical"
                iconType="circle"
                wrapperStyle={{
                  paddingLeft: '30px',
                  fontSize: '10px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: '130px',
                  right: 0,
                  top: 20
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
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#grad-${key})`}
                    animationDuration={1200}
                    isAnimationActive={true}
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