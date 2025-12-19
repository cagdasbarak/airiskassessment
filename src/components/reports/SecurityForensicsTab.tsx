import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert, Info } from 'lucide-react';
import { AssessmentReport } from '@/lib/api';
interface SecurityForensicsTabProps {
  report: AssessmentReport;
}
const COLORS = [
  'hsl(24, 90%, 55%)',  // Cloudflare Orange
  'hsl(217, 91%, 60%)',  // Blue
  'hsl(271, 91%, 65%)',  // Purple
  'hsl(142, 71%, 45%)',  // Emerald
  'hsl(329, 81%, 56%)'   // Pink
];
export function SecurityForensicsTab({ report }: SecurityForensicsTabProps) {
  const trendData = report.securityCharts?.topAppsTrends || [];
  // Dynamically derive keys from the data (excluding 'date')
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
  if (trendData.length === 0) {
    return (
      <Card className="border-border/50 shadow-soft bg-white/40 dark:bg-black/20 backdrop-blur-xl h-[500px] flex flex-col items-center justify-center p-12 text-center">
        <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-6">
          <ShieldAlert className="h-8 w-8 text-muted-foreground opacity-20" />
        </div>
        <CardTitle className="text-xl font-black uppercase tracking-tight mb-2">Insufficient Analytics Data</CardTitle>
        <CardDescription className="max-w-md">
          The forensic engine requires at least 24 hours of Cloudflare Gateway telemetry to generate a trending distribution.
        </CardDescription>
        <div className="mt-8 px-6 py-4 rounded-2xl bg-secondary/50 border border-border/50 flex items-center gap-3 text-left">
          <Info className="h-5 w-5 text-[#F38020] shrink-0" />
          <p className="text-xs font-medium text-muted-foreground">
            Ensure "L7 Firewall" and "HTTP Filtering" are enabled in your Cloudflare Zero Trust dashboard to capture AI application signatures.
          </p>
        </div>
      </Card>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-0 h-full min-h-[600px] flex flex-col"
    >
      <Card className="flex-1 border-border/50 shadow-soft bg-white/40 dark:bg-black/20 backdrop-blur-xl overflow-hidden flex flex-col">
        <CardHeader className="border-b border-border/10 pb-6 flex-shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black tracking-tight text-foreground uppercase">Top Trending AI Applications</CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">30-Day Forensic Timeseries ��� Unique User Engagement</CardDescription>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-tighter hidden md:block">
            Verified by Shadow IT Engine
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-4 md:p-8 min-h-[500px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart
              data={trendData}
              margin={{ top: 20, right: 140, left: 10, bottom: 60 }}
            >
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
                interval="preserveStartEnd"
                dy={10}
                angle={-45}
                textAnchor="end"
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono', fill: 'currentColor' }} dx={-5} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend
                verticalAlign="top"
                align="right"
                layout="vertical"
                iconType="circle"
                wrapperStyle={{ 
                  paddingLeft: '40px', 
                  fontSize: '10px', 
                  fontWeight: 900, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em', 
                  width: '130px', 
                  right: 0, 
                  top: 20 
                }}
              />
              {appKeys.map((key, idx) => (
                <Bar 
                  key={key} 
                  dataKey={key} 
                  stackId="a" 
                  fill={COLORS[idx % COLORS.length]} 
                  radius={[0, 0, 0, 0]} 
                  animationDuration={1500} 
                  minPointSize={2} 
                />
              ))}
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] px-2 py-4">
        <span>Dynamic Forensic Projection</span>
        <span>Secure Protocol verified</span>
      </div>
    </motion.div>
  );
}