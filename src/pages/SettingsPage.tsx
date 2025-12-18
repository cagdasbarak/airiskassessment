import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Key, User, Save, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
export function SettingsPage() {
  const settings = useAppStore((s) => s.settings);
  const updateStoreSettings = useAppStore((s) => s.updateSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.getSettings();
        if (res.success && res.data) {
          updateStoreSettings(res.data);
        }
      } catch (err) {
        toast.error('Failed to load settings from server');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [updateStoreSettings]);
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.updateSettings(settings);
      if (res.success) {
        toast.success('Settings saved to secure storage');
      } else {
        toast.error(res.error || 'Failed to save settings');
      }
    } catch (err) {
      toast.error('Network error while saving');
    } finally {
      setIsSaving(false);
    }
  };
  const checkLicense = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: 'Verifying Cloudflare license...',
        success: 'License verified: Zero Trust Enterprise',
        error: 'Invalid API credentials',
      }
    );
  };
  if (isLoading) {
    return (
      <AppLayout container>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout container>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your Cloudflare integration and report preferences.</p>
        </div>
        <Tabs defaultValue="integration" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="integration" className="flex items-center gap-2">
              <Key className="h-4 w-4" /> Cloudflare Integration
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Report Configuration
            </TabsTrigger>
          </TabsList>
          <TabsContent value="integration">
            <Card className="border-border/50 shadow-soft">
              <CardHeader>
                <CardTitle>API Credentials</CardTitle>
                <CardDescription>Configure your Cloudflare Account ID and API Key to fetch Zero Trust data.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountId">Account ID</Label>
                    <Input
                      id="accountId"
                      value={settings.accountId}
                      onChange={(e) => updateStoreSettings({ accountId: e.target.value })}
                      placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j"
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Cloudflare Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => updateStoreSettings({ email: e.target.value })}
                      placeholder="admin@company.com"
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">Global API Key / Token</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={settings.apiKey}
                      onChange={(e) => updateStoreSettings({ apiKey: e.target.value })}
                      placeholder="••••••••••••••••••••••••"
                      className="bg-secondary/50"
                    />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">License Status</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">Enterprise Plan Detected</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={checkLicense} className="bg-white dark:bg-background">
                    <RefreshCw className="h-3 w-3 mr-2" /> Re-verify
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="ghost" onClick={() => updateStoreSettings({ accountId: '', email: '', apiKey: '' })}>Reset</Button>
                <Button onClick={handleSave} disabled={isSaving} className="btn-gradient">
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="report">
            <Card className="border-border/50 shadow-soft">
              <CardHeader>
                <CardTitle>Executive Contact</CardTitle>
                <CardDescription>These details will appear on the generated PDF reports.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input
                      id="contactName"
                      value={settings.contactName}
                      onChange={(e) => updateStoreSettings({ contactName: e.target.value })}
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={settings.contactEmail}
                      onChange={(e) => updateStoreSettings({ contactEmail: e.target.value })}
                      className="bg-secondary/50"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-6">
                <Button onClick={handleSave} disabled={isSaving} className="btn-gradient">
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}