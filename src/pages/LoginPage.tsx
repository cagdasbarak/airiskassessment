import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import { ThemeToggle } from '@/components/ThemeToggle';
export function LoginPage() {
  const navigate = useNavigate();
  const setAuthenticated = useAppStore(s => s.setAuthenticated);
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticated(true);
    navigate('/');
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <ThemeToggle />
      <div className="absolute inset-0 bg-gradient-to-br from-[#F38020]/10 via-transparent to-blue-500/10 pointer-events-none" />
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-border/50">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-[#F38020] flex items-center justify-center shadow-lg floating">
              <ShieldAlert className="h-10 w-10 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight">RiskGuard AI</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="admin@company.com" 
                  className="pl-10 bg-secondary/50" 
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 bg-secondary/50" 
                  required 
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full btn-gradient h-11 text-lg font-semibold">
              Sign In
            </Button>
          </CardFooter>
        </form>
      </Card>
      <div className="absolute bottom-8 text-center text-sm text-muted-foreground">
        <p>Note: This project has AI capabilities with request limits.</p>
      </div>
    </div>
  );
}