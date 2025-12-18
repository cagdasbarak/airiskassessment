import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, Search, Filter, LayoutGrid, BadgeAlert, BadgeCheck, BadgeHelp, Users, Activity, BarChart3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { motion } from 'framer-motion';
import { AssessmentReport } from '@/lib/api';
import { cn } from '@/lib/utils';
interface AppLibraryTabProps {
  report: AssessmentReport;
}
export function AppLibraryTab({ report }: AppLibraryTabProps) {
  const apps = useMemo(() => report.appLibrary || [], [report.appLibrary]);
  const distributionData = useMemo(() => {
    const counts = apps.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return [
      { status: 'Approved', count: counts['Approved'] || 0, fill: '#10B981' },
      { status: 'Review', count: counts['Review'] || 0, fill: '#F38020' },
      { status: 'Unapproved', count: counts['Unapproved'] || 0, fill: '#EF4444' },
      { status: 'Unreviewed', count: counts['Unreviewed'] || 0, fill: '#6B7280' },
    ];
  }, [apps]);
  const distributionConfig = useMemo(() => ({
    count: { label: 'Applications' },
    Approved: { label: 'Approved', color: '#10B981' },
    Review: { label: 'Review', color: '#F38020' },
    Unapproved: { label: 'Unapproved', color: '#EF4444' },
  }), []);
  if (apps.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="border-border/50 shadow-soft bg-white/40 dark:bg-black/20 backdrop-blur-xl overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-center p-12">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-[#F38020]/20 blur-3xl rounded-full" />
            <div className="relative h-24 w-24 rounded-[2rem] bg-gradient-to-br from-[#F38020] to-[#E55A1B] flex items-center justify-center shadow-glow">
              <ShieldCheck className="h-12 w-12 text-white animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter mb-4 uppercase text-foreground">
            Inventory Not Populated
          </CardTitle>
          <CardDescription className="max-w-md text-base font-medium leading-relaxed text-muted-foreground">
            The deep-packet inspection engine did not detect any significant AI application usage within the audited log window.
          </CardDescription>
        </Card>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-border/50 shadow-soft bg-white/40 dark:bg-black/20 backdrop-blur-xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#F38020]" />
              <CardTitle className="text-sm font-black uppercase tracking-widest">Security Status Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={distributionConfig} height={180}>
              <BarChart
                layout="vertical"
                data={distributionData}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="status"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor' }}
                  width={80}
                />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-soft bg-[#F38020]/5 backdrop-blur-xl overflow-hidden flex flex-col justify-center p-6 text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-white/50 dark:bg-black/20 mx-auto flex items-center justify-center mb-2">
            <Activity className="h-6 w-6 text-[#F38020]" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Managed Library</p>
          <h4 className="text-4xl font-black text-foreground">{apps.length}</h4>
          <p className="text-xs font-bold text-[#F38020] uppercase tracking-wider">Detected Assets</p>
        </Card>
      </div>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search detected AI applications..." className="pl-10 bg-white/50 dark:bg-black/20 border-border/50 rounded-xl h-11" />
          </div>
          <div className="flex gap-2">
            <div className="px-4 py-2 bg-secondary/50 rounded-xl border border-border/50 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 cursor-pointer hover:bg-secondary">
              <Filter className="h-3 w-3" /> Filters
            </div>
            <div className="px-4 py-2 bg-[#F38020]/10 rounded-xl border border-[#F38020]/20 text-xs font-bold uppercase tracking-wider text-[#F38020] flex items-center gap-2 cursor-pointer hover:bg-[#F38020]/20">
              <LayoutGrid className="h-3 w-3" /> View Mode
            </div>
          </div>
        </div>
        <Card className="border-border/50 shadow-soft bg-white/40 dark:bg-black/20 backdrop-blur-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow className="hover:bg-transparent border-border/10">
                <TableHead className="w-[300px] text-[10px] font-black uppercase tracking-widest">Application</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Category</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">User Count</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Risk Factor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.map((app) => (
                <TableRow key={app.appId} className="hover:bg-secondary/20 border-border/10 transition-colors">
                  <TableCell className="font-bold py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-foreground">{app.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md">
                      {app.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-none",
                      app.status === 'Approved' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                      app.status === 'Unapproved' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                      "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    )}>
                      <div className="flex items-center gap-1.5">
                        {app.status === 'Approved' ? <BadgeCheck className="h-3 w-3" /> :
                         app.status === 'Unapproved' ? <BadgeAlert className="h-3 w-3" /> :
                         <BadgeHelp className="h-3 w-3" />}
                        {app.status}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 text-sm font-mono font-bold">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      {app.users}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black",
                      app.risk_score > 70 ? "text-red-500 bg-red-500/10" :
                      app.risk_score > 40 ? "text-amber-500 bg-amber-500/10" :
                      "text-emerald-500 bg-emerald-500/10"
                    )}>
                      {app.risk_score}/100
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
      <div className="flex items-center justify-between text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] px-2">
        <span>Displaying {apps.length} Risk Assets</span>
        <span>Synced with Cloudflare ZTNA Engine</span>
      </div>
    </motion.div>
  );
}