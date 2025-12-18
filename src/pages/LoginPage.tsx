import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from 'sonner';
export function LoginPage() {
  const navigate = useNavigate();
  const setAuthenticated = useAppStore(s => s.setAuthenticated);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      setAuthenticated(true, 'admin');
      toast.success('Welcome back, Admin');
      navigate('/');
    } else {
      toast.error('Invalid credentials', {
        description: 'Please use the default administrator credentials.'
      });
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <ThemeToggle />
      <div className="absolute inset-0 bg-gradient-to-br from-[#F38020]/10 via-transparent to-blue-500/10 pointer-events-none" />
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-border/50">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-[#F38020] flex items-center justify-center shadow-lg animate-float">
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
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Username (admin)"
                  className="pl-10 bg-secondary/50"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password (admin)"
                  className="pl-10 bg-secondary/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
      <div className="absolute bottom-8 text-center text-sm text-muted-foreground/50 px-8 max-w-lg">
        <p>Note: Although this project has AI capabilities, there is a limit on the number of requests that can be made to the AI servers across all user apps in a given time period.</p>
      </div>
    </div>
  );
}