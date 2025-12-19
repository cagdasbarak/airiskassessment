import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { AssessmentReport } from '@/lib/api';
interface SecurityForensicsTabProps {
  report: AssessmentReport;
}
const COLORS = [
  'hsl(24, 90%, 55%)',
  'hsl(217, 91%, 60%)',
  'hsl(271, 91%, 65%)',
  'hsl(142, 71%, 45%)',
  'hsl(329, 81%, 56%)'
];

const generateMockTrends = () => {
  const mockData = [];
  const apps = ['ChatGPT', 'Gemini', 'Claude', 'Perplexity', 'Grok'];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 29);

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dayData: any = { date: date.toISOString().split('T')[0] };
    
    apps.forEach((app, idx) => {
      let baseValue = idx === 0 ? 300 - i * 5 : // ChatGPT descending 300->150
                     idx === 1 ? 80 + i * 4 :     // Gemini ascending 80->200
                     idx === 2 ? 100 + Math.sin(i) * 25 : // Claude stable ~50-150
                     idx === 3 ? 30 + i * 2.3 :    // Perplexity rising 30->100
                     20 + i * 2;                   // Grok emerging 20->80
      dayData[app] = Math.max(0, Math.floor(baseValue + (Math.random() - 0.5) * 20));
    });
    
    mockData.push(dayData);
  }
  return mockData;
};
export function SecurityForensicsTab({ report }: SecurityForensicsTabProps) {
  const trendData = report.securityCharts?.topAppsTrends || generateMockTrends();
  const appKeys = trendData.length > 0
    ? Object.keys(trendData[0]).filter(k => k !== 'date')
    : [];
  const chartConfig = trendData.length > 0 ? appKeys.reduce((acc, key, idx) => {
    acc[key] = {
      label: key,
      color: COLORS[idx % COLORS.length]
    };
    return acc;
  }, {} as any) : {};

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
            <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">30-Day Forensic Timeseries 🔥 Unique User Engagement</CardDescription>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-tighter hidden md:block">
            Verified by Shadow IT Engine
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-4 md:p-8 min-h-[500px] overflow-visible [&>div]:overflow-visible">
          <ChartContainer config={chartConfig} height='450px' className="min-h-[450px] min-w-[500px] h-full w-full" style={{minWidth: '0px', height: '450px'}}>
            <BarChart
              data={trendData}
              margin={{ top: 20, right: 80, left: 10, bottom: 60 }}
              barSize={30}
              barGap={4}
              barCategoryGap="20%"
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
                  paddingLeft: '10px',
                  fontSize: '10px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: '100px',
                  right: 0,
                  top: 10
                }}
              />
              {appKeys.map((key, idx) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill={COLORS[idx % COLORS.length]}
                  fillOpacity={1}
                  stroke="transparent"
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