import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, Search, Filter, LayoutGrid, ArrowUpRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
export function AppLibraryTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-2">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search detected AI applications..." className="pl-10 bg-white/50 dark:bg-black/20 border-border/50 rounded-xl" disabled />
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-secondary/50 rounded-xl border border-border/50 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Filter className="h-3 w-3" /> Filters
          </div>
          <div className="px-4 py-2 bg-[#F38020]/10 rounded-xl border border-[#F38020]/20 text-xs font-bold uppercase tracking-wider text-[#F38020] flex items-center gap-2">
            <LayoutGrid className="h-3 w-3" /> View Mode
          </div>
        </div>
      </div>
      <Card className="border-border/50 shadow-soft bg-white/40 dark:bg-black/20 backdrop-blur-xl overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-center p-12">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-[#F38020]/20 blur-3xl rounded-full" />
          <div className="relative h-24 w-24 rounded-[2rem] bg-gradient-to-br from-[#F38020] to-[#E55A1B] flex items-center justify-center shadow-glow">
            <ShieldCheck className="h-12 w-12 text-white animate-pulse" />
          </div>
        </div>
        <CardTitle className="text-3xl font-black tracking-tight mb-4 uppercase">
          Application Inventory Syncing
        </CardTitle>
        <CardDescription className="max-w-md text-base font-medium leading-relaxed">
          The deep-packet inspection engine is currently aggregating Gateway application logs. 
          Detailed per-app policy analysis and user telemetry will be available momentarily.
        </CardDescription>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          {[
            { label: 'Policy Coverage', val: 'Detecting...' },
            { label: 'Asset Library', val: 'Cataloging...' },
            { label: 'Risk Mapping', val: 'Calculating...' }
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col items-center gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{item.label}</span>
              <span className="text-sm font-bold">{item.val}</span>
            </div>
          ))}
        </div>
        <div className="mt-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#F38020] animate-bounce cursor-default">
          Reviewing 42+ Corporate Policy Bindings <ArrowUpRight className="h-3 w-3" />
        </div>
      </Card>
    </motion.div>
  );
}