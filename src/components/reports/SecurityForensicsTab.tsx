import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { motion } from 'framer-motion';
import { AssessmentReport } from '@/lib/api';
interface SecurityForensicsTabProps {
  report: AssessmentReport;
}
const COLORS = [
  '#F38020', // Cloudflare Orange
  '#3B82F6', // Blue
  '#A855F7', // Purple
  '#10B981', // Emerald
  '#EC4899'  // Pink
];
export function SecurityForensicsTab({ report }: SecurityForensicsTabProps) {
  const trendData = useMemo(() => report.securityCharts?.topAppsTrends || [], [report.securityCharts]);
  const appKeys = useMemo(() => {
    if (trendData.length === 0) return [];
    // Get all keys except 'date'
    return Object.keys(trendData[0]).filter(k => k !== 'date');
  }, [trendData]);
  const chartConfig = useMemo(() => {
    if (appKeys.length === 0) return { empty: { label: 'No Data', color: '#ccc' } };
    return appKeys.reduce((acc, key, idx) => {
      acc[key] = {
        label: key,
        color: COLORS[idx % COLORS.length]
      };
      return acc;
    }, {} as any);
  }, [appKeys]);
  if (trendData.length === 0) {
    return (
      <Card className="border-border/50 shadow-soft bg-white/40 dark:bg-black/20 h-[450px] flex items-center justify-center">
        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs opacity-40">No Forensic Trend Data Available</p>
      </Card>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 h-full"
    >
      <Card className="border-border/50 shadow-soft bg-white/40 dark:bg-black/20 backdrop-blur-xl overflow-hidden flex flex-col h-full">
        <CardHeader className="border-b border-border/10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black tracking-tight text-foreground uppercase">Top Trending AI Applications</CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Forensic Timeseries ��� Unique User Engagement</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-8 flex-1">
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
                  className="text-foreground"
                  tickFormatter={(val) => {
                    try {
                      const d = new Date(val);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    } catch { return val; }
                  }}
                  interval="preserveStartEnd"
                  dy={10}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono', fill: 'currentColor' }}
                  className="text-foreground"
                  allowDecimals={false}
                />
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