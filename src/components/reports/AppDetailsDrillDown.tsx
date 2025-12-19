import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShieldCheck, History, Search, FileWarning, Terminal, Globe } from 'lucide-react';
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
    policies: Policy[];
    usage: UsageEvent[];
  };
}
export function AppDetailsDrillDown({ app }: AppDetailsDrillDownProps) {
  const [filter, setFilter] = useState('');
  const filteredUsage = app.usage.filter(u => 
    u.userEmail.toLowerCase().includes(filter.toLowerCase()) ||
    u.clientIP.includes(filter) ||
    u.action.toLowerCase().includes(filter.toLowerCase())
  );
  const isPromptEvent = (event: UsageEvent) => {
    // Simulated prompt analysis
    return Math.random() > 0.8;
  };
  return (
    <div className="space-y-6 bg-background/50 rounded-xl p-4 border border-border/50">
      <div className="flex items-center justify-between border-b pb-4 border-border/50">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Terminal className="h-4 w-4 text-[#F38020]" /> Security Profile: {app.name}
        </h3>
      </div>
      <Tabs defaultValue="policies" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="policies" className="text-xs">
            <ShieldCheck className="h-3 w-3 mr-2" /> Security Policies
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">
            <History className="h-3 w-3 mr-2" /> Detailed Activity
          </TabsTrigger>
        </TabsList>
        <TabsContent value="policies" className="mt-4">
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-secondary/20">
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-bold">Rule Name</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Scope</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {app.policies.length > 0 ? app.policies.map((p, i) => (
                  <TableRow key={i} className="hover:bg-secondary/5">
                    <TableCell className="text-xs font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {p.type === 'Gateway' ? <Globe className="h-2.5 w-2.5 mr-1" /> : <ShieldCheck className="h-2.5 w-2.5 mr-1" />}
                        {p.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={cn(
                        "text-[10px] h-5",
                        p.action === 'Allow' ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"
                      )}>
                        {p.action}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-xs text-muted-foreground italic">
                      No specific Cloudflare rules detected for this application.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="activity" className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search user, IP, or action..."
                className="pl-8 h-9 text-xs bg-background/50"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-secondary/20">
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-bold">User / IP</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Action</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Data Vol</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsage.length > 0 ? filteredUsage.map((u, i) => (
                  <TableRow key={i} className={cn("hover:bg-secondary/5", isPromptEvent(u) && "bg-orange-50/10")}>
                    <TableCell className="text-xs">
                      <div className="font-medium">{u.userEmail}</div>
                      <div className="text-[10px] text-muted-foreground">{u.clientIP}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{u.action}</span>
                        {isPromptEvent(u) && (
                          <Badge variant="outline" className="text-[8px] h-4 bg-orange-500/10 text-orange-500 border-orange-500/20">
                            PROMPT DETECTED
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{u.bytesKB} KB</TableCell>
                    <TableCell className="text-right text-[10px] text-muted-foreground font-mono">
                      {new Date(u.date).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <FileWarning className="h-6 w-6 opacity-20" />
                        <p className="text-xs">No matching events found in the Zero Trust logs.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}