import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { motion } from 'framer-motion';
import { AssessmentReport } from '@/lib/api';
interface SecurityForensicsTabProps {
  report: AssessmentReport;
}
const COLORS = [
  '#F38020',
  '#3B82F6',
  '#A855F7',
  '#10B981',
  '#EC4899'
];
export function SecurityForensicsTab({ report }: SecurityForensicsTabProps) {
  const trendData = report.securityCharts?.topAppsTrends || [];
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
      className="space-y-6"
    >
      <Card className="border-border/50 shadow-soft bg-white/40 dark:bg-black/20 backdrop-blur-xl overflow-hidden flex flex-col">
        <CardHeader className="border-b border-border/10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black tracking-tight text-foreground uppercase">Top Trending AI Applications</CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">30-Day Forensic Timeseries 🔥 Unique User Engagement</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-8">
          <div className="w-full h-[450px] min-h-[450px] overflow-hidden rounded-xl">
            <ChartContainer config={chartConfig} height={450}>
              <BarChart
                data={trendData}
                margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                barSize={30}
                barGap={4}
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
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono', fill: 'currentColor' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{
                    paddingBottom: '20px',
                    fontSize: '10px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                />
                {appKeys.map((key, idx) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="a"
                    fill={COLORS[idx % COLORS.length]}
                    fillOpacity={1}
                    radius={[0, 0, 0, 0]}
                    animationDuration={1500}
                  />
                ))}
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] px-2">
        <span>Dynamic Forensic Projection</span>
        <span>Secure Protocol Verified</span>
      </div>
    </motion.div>
  );
}