import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShieldCheck, History, Search, Globe, Lock, MessageSquare, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
interface Policy {
  name: string;
  action: string;
  type: 'Gateway' | 'Access';
}
interface UsageEvent {
  clientIP: string;
  userEmail: string;
  action: string;
  date: string;
  bytesKB: number;
}
interface AppDetailsDrillDownProps {
  app: {
    name: string;
    policies?: Policy[];
    usage?: UsageEvent[];
  };
}
export function AppDetailsDrillDown({ app }: AppDetailsDrillDownProps) {
  const [filter, setFilter] = useState('');
  const policies = app.policies ?? [];
  const usage = app.usage ?? [];
  const gatewayPolicies = policies.filter(p => p.type === 'Gateway');
  const accessPolicies = policies.filter(p => p.type === 'Access');
  const filteredUsage = usage.filter(u =>
    (u.userEmail?.toLowerCase() ?? '').includes(filter.toLowerCase()) ||
    (u.clientIP ?? '').includes(filter)
  );
  // Simulated detection for "Prompt Logs"
  const promptLogs = filteredUsage.slice(0, 10).map(u => ({ 
    ...u, 
    prompt: "Sensitive telemetry fragment analyzed for risk intent (redacted for privacy compliance)." 
  }));
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
      <Tabs defaultValue="policies" className="w-full">
        <TabsList className="bg-secondary/30 p-1 rounded-xl w-fit mb-6 no-print">
          <TabsTrigger value="policies" className="text-xs font-bold rounded-lg px-6">
            <ShieldCheck className="h-3.5 w-3.5 mr-2" /> Security Controls
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs font-bold rounded-lg px-6">
            <History className="h-3.5 w-3.5 mr-2" /> Raw Traffic Logs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="policies" className="space-y-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Globe className="h-4 w-4 text-blue-500" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Gateway Filtering Policies</h4>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/50 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-secondary/20">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-bold">Rule Name</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gatewayPolicies.length > 0 ? gatewayPolicies.map((p, i) => (
                    <TableRow key={i} className="hover:bg-secondary/5 border-b-0">
                      <TableCell className="text-xs font-medium">{p.name || 'Anonymous Rule'}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={cn("text-[9px] font-bold h-5", p.action === 'Allow' ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200")} variant="outline">{p.action}</Badge>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={2} className="text-center py-8 text-xs text-muted-foreground italic">No Gateway rules found for this application.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Lock className="h-4 w-4 text-purple-500" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Access Authentication Policies</h4>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/50 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-secondary/20">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-bold">Policy Label</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-right">Access State</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessPolicies.length > 0 ? accessPolicies.map((p, i) => (
                    <TableRow key={i} className="hover:bg-secondary/5 border-b-0">
                      <TableCell className="text-xs font-medium">{p.name || 'Access Policy'}</TableCell>
                      <TableCell className="text-right">
                        <Badge className="text-[9px] font-bold h-5 bg-blue-500/10 text-blue-600 border-blue-200" variant="outline">Enforced</Badge>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={2} className="text-center py-8 text-xs text-muted-foreground italic">No specific Access policies detected.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="activity" className="space-y-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#F38020]" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">HTTP Request Stream (Live)</h4>
              </div>
              <div className="relative w-48 no-print">
                <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                <Input placeholder="Filter user/IP..." className="pl-8 h-8 text-[10px] bg-background/50" value={filter} onChange={(e) => setFilter(e.target.value)} />
              </div>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/50 overflow-hidden h-48 overflow-y-auto shadow-sm">
              {filteredUsage.length > 0 ? (
                <Table>
                  <TableHeader className="bg-secondary/20 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-bold">User Context</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Action</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Volume</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsage.map((u, i) => (
                      <TableRow key={i} className="hover:bg-secondary/5 border-b-0">
                        <TableCell className="text-[10px]">
                          <div className="font-bold">{u.userEmail || 'anonymous'}</div>
                          <div className="text-muted-foreground opacity-70">{u.clientIP || '0.0.0.0'}</div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-[8px] h-4 uppercase">{u.action || 'Unknown'}</Badge></TableCell>
                        <TableCell className="text-[10px] font-mono">{u.bytesKB ?? 0} KB</TableCell>
                        <TableCell className="text-right text-[10px] font-mono opacity-50">{u.date ? new Date(u.date).toLocaleTimeString() : '--:--'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs space-y-2">
                  <AlertCircle className="h-5 w-5 opacity-20" />
                  <p>No traffic events found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <MessageSquare className="h-4 w-4 text-orange-500" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Deep Packet Inspection (Intent Analysis)</h4>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/50 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-secondary/20">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-bold w-[120px]">User</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold">AI Prompt / Data Intent Fragment</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promptLogs.length > 0 ? promptLogs.map((p, i) => (
                    <TableRow key={i} className="hover:bg-secondary/5 border-b-0">
                      <TableCell className="text-[10px] font-bold">{p.userEmail || 'anonymous'}</TableCell>
                      <TableCell className="text-[10px] italic text-muted-foreground">"{p.prompt}"</TableCell>
                      <TableCell className="text-right"><Badge className="text-[8px] bg-orange-500/10 text-orange-600 border-orange-200" variant="outline">Monitored</Badge></TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-xs text-muted-foreground italic">No prompt activity recorded for this period.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}