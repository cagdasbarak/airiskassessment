import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShieldCheck, History, Search, Globe, Lock, MessageSquare, AlertCircle, Terminal } from 'lucide-react';
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
  prompt?: string;
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
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
      <Tabs defaultValue="policies" className="w-full">
        <TabsList className="bg-secondary/50 p-1 rounded-xl w-fit mb-6 no-print">
          <TabsTrigger value="policies" className="text-xs font-bold rounded-lg px-6 h-8">
            <ShieldCheck className="h-3.5 w-3.5 mr-2" /> Security Controls
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs font-bold rounded-lg px-6 h-8">
            <History className="h-3.5 w-3.5 mr-2" /> Raw Traffic Logs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="policies" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Globe className="h-4 w-4 text-blue-500" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gateway Policies</h4>
              </div>
              <div className="rounded-xl border border-border/30 bg-background/50 overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-secondary/20">
                    <TableRow>
                      <TableHead className="text-[9px] uppercase font-bold">Rule Name</TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gatewayPolicies.length > 0 ? gatewayPolicies.map((p, i) => (
                      <TableRow key={i} className="hover:bg-secondary/10 border-b-0">
                        <TableCell className="text-[11px] font-medium py-2">{p.name}</TableCell>
                        <TableCell className="text-right py-2">
                          <Badge className={cn("text-[8px] font-bold h-4", p.action === 'Allow' ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200")} variant="outline">{p.action}</Badge>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={2} className="text-center py-6 text-[10px] text-muted-foreground italic">No Gateway rules detected.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Lock className="h-4 w-4 text-purple-500" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Access Policies</h4>
              </div>
              <div className="rounded-xl border border-border/30 bg-background/50 overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-secondary/20">
                    <TableRow>
                      <TableHead className="text-[9px] uppercase font-bold">Policy Label</TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-right">State</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessPolicies.length > 0 ? accessPolicies.map((p, i) => (
                      <TableRow key={i} className="hover:bg-secondary/10 border-b-0">
                        <TableCell className="text-[11px] font-medium py-2">{p.name}</TableCell>
                        <TableCell className="text-right py-2">
                          <Badge className="text-[8px] font-bold h-4 bg-blue-500/10 text-blue-600 border-blue-200" variant="outline">Enforced</Badge>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={2} className="text-center py-6 text-[10px] text-muted-foreground italic">No Access policies detected.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="activity" className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-[#F38020]" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">HTTP Request Stream</h4>
              </div>
              <div className="relative w-48 no-print">
                <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                <Input placeholder="Filter IP/User..." className="pl-7 h-7 text-[10px] bg-background/80" value={filter} onChange={(e) => setFilter(e.target.value)} />
              </div>
            </div>
            <div className="rounded-xl border border-border/30 bg-background/50 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-secondary/20">
                  <TableRow>
                    <TableHead className="text-[9px] uppercase font-bold">Context</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold">Intent</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-right">Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsage.length > 0 ? filteredUsage.map((u, i) => (
                    <TableRow key={i} className="hover:bg-secondary/10 border-b-0">
                      <TableCell className="py-3">
                        <div className="text-[11px] font-bold">{u.userEmail}</div>
                        <div className="text-[9px] text-muted-foreground font-mono">{u.clientIP}</div>
                      </TableCell>
                      <TableCell className="py-3 max-w-[300px]">
                        <div className="text-[10px] font-mono bg-secondary/30 p-1.5 rounded border border-border/50 text-foreground/80">
                          {u.prompt ? `"${u.prompt}"` : 'No prompt log captured'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <div className="text-[10px] font-mono">{u.bytesKB} KB</div>
                        <div className="text-[8px] text-muted-foreground">{new Date(u.date).toLocaleTimeString()}</div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={3} className="text-center py-12 text-[11px] text-muted-foreground italic">No traffic logs found for this application.</TableCell></TableRow>
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