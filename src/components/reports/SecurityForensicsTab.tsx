import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, PieChart, Activity, Fingerprint, Lock, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
export function SecurityForensicsTab() {
  const placeholders = [
    { title: "Usage Velocity", desc: "AI Request Frequency Trends", icon: Activity },
    { title: "Data Flow Distribution", desc: "Top Exfiltration Risk Vectors", icon: PieChart },
    { title: "Geographic Compliance", desc: "Regional Endpoint Origins", icon: Globe },
    { title: "Forensic Authentication", desc: "Identity Provider Correlation", icon: Fingerprint },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {placeholders.map((p, i) => (
          <Card key={i} className="border-border/50 shadow-soft bg-white/30 dark:bg-black/10 backdrop-blur-md overflow-hidden group">
            <CardHeader className="border-b border-border/10 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                    <p.icon className="h-5 w-5 text-muted-foreground group-hover:text-[#F38020] transition-colors" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black uppercase tracking-tight">{p.title}</CardTitle>
                    <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground/60">{p.desc}</CardDescription>
                  </div>
                </div>
                <div className="px-2 py-1 rounded-md bg-secondary/50 text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                  Analyzing...
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-64 flex flex-col items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-mesh opacity-5" />
              <div className="w-full h-full border-2 border-dashed border-border/30 rounded-2xl flex flex-col items-center justify-center gap-4 group-hover:border-[#F38020]/20 transition-colors">
                <BarChart3 className="h-12 w-12 text-muted-foreground/20 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Visualizing Log Streams</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="p-6 rounded-[2rem] bg-[#F38020]/5 border border-[#F38020]/10 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white dark:bg-black/40 flex items-center justify-center shadow-sm">
            <Lock className="h-6 w-6 text-[#F38020]" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight">ZTNA Log Synchronization</h4>
            <p className="text-xs text-muted-foreground font-medium italic">Connected to Cloudflare Gateway API via riskguard-ai-agent-v1</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest">Active Tunnel</span>
        </div>
      </div>
    </motion.div>
  );
}