import React, { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, Key, User, Save, RefreshCw, Loader2, Building2, Briefcase, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { api, LicenseInfo } from '@/lib/api';
const FeatureCheck = ({ label, enabled }: { label: string, enabled: boolean }) => (
  <div className="flex items-center justify-between py-2 border-b last:border-0 border-border/30">
    <span className="text-sm font-medium">{label}</span>
    {enabled ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-muted-foreground/40" />
    )}
  </div>
);
export function SettingsPage() {
  const accountId = useAppStore(s => s.settings.accountId);
  const email = useAppStore(s => s.settings.email);
  const apiKey = useAppStore(s => s.settings.apiKey);
  const cfContactName = useAppStore(s => s.settings.cloudflareContact.name);
  const cfContactRole = useAppStore(s => s.settings.cloudflareContact.role);
  const cfContactEmail = useAppStore(s => s.settings.cloudflareContact.email);
  const cfContactTeam = useAppStore(s => s.settings.cloudflareContact.team);
  const custContactName = useAppStore(s => s.settings.customerContact.name);
  const custContactRole = useAppStore(s => s.settings.customerContact.role);
  const custContactEmail = useAppStore(s => s.settings.customerContact.email);
  const custCustomerName = useAppStore(s => s.settings.customerContact.customerName);
  const updateStoreSettings = useAppStore(s => s.updateSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [isCheckingLicense, setIsCheckingLicense] = useState(false);
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.getSettings();
        if (res.success && res.data) {
          updateStoreSettings(res.data);
        }
      } catch (err) {
        console.error('Failed to load settings', err);
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
      const currentSettings = useAppStore.getState().settings;
      const res = await api.updateSettings(currentSettings);
      if (res.success) {
        toast.success('Settings saved securely');
      } else {
        toast.error(res.error || 'Failed to save settings');
      }
    } catch (err) {
      toast.error('Network error while saving');
    } finally {
      setIsSaving(false);
    }
  };
  const checkLicense = async () => {
    setIsCheckingLicense(true);
    try {
      const res = await api.checkLicense();
      if (res.success && res.data) {
        setLicense(res.data);
        toast.success('License verified successfully');
      } else {
        toast.error(res.error || 'License verification failed');
      }
    } catch (err) {
      toast.error('Connection error during license check');
    } finally {
      setIsCheckingLicense(false);
    }
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
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your Cloudflare integration and report preferences.</p>
          </div>
          {license && (
            <Card className="w-full md:w-80 border-[#F38020]/20 shadow-soft bg-secondary/30">
              <CardHeader className="py-4 px-5 border-b">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4 text-[#F38020]" />
                  <span className="text-sm font-bold uppercase tracking-wider">License Status</span>
                </div>
                <CardTitle className="text-lg">Cloudflare Zero Trust Licenses</CardTitle>
                <CardDescription className="text-xs">Summary of your Cloudflare Zero Trust licenses.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">ZTNA Plan/User</span>
                    <span className="font-bold text-[#F38020]">{license.plan ?? 'N/A'}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">Licenses</span>
                      <span className="font-bold">{(license.usedLicenses ?? 0)}/{(license.totalLicenses ?? 1)} used</span>
                    </div>
                    <Progress value={((license.usedLicenses ?? 0) / (license.totalLicenses || 1)) * 100} className="h-2" />
                  </div>
                </div>
                <div className="pt-4 border-t border-border/50">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Feature Checklist</h4>
                  <FeatureCheck label="Access Subscription" enabled={!!license.accessSub} />
                  <FeatureCheck label="Gateway Subscription" enabled={!!license.gatewaySub} />
                  <FeatureCheck label="Add-on CASB" enabled={!!license.casb} />
                  <FeatureCheck label="Add-on DLP" enabled={!!license.dlp} />
                  <FeatureCheck label="Add-on RBI" enabled={!!license.rbi} />
                </div>
              </CardContent>
            </Card>
          )}
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
                      value={accountId}
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
                      value={email}
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
                      value={apiKey}
                      onChange={(e) => updateStoreSettings({ apiKey: e.target.value })}
                      placeholder="••••••••••••••••••••••••"
                      className="bg-secondary/50"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={checkLicense} disabled={isCheckingLicense}>
                    {isCheckingLicense ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                    Check License
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border/50 shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#F38020]" />
                    Cloudflare Contact
                  </CardTitle>
                  <CardDescription>Internal Cloudflare representative details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={cfContactName}
                      onChange={(e) => updateStoreSettings({ cloudflareContact: { name: e.target.value, role: cfContactRole, email: cfContactEmail, team: cfContactTeam } })}
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input
                      value={cfContactRole}
                      onChange={(e) => updateStoreSettings({ cloudflareContact: { role: e.target.value, name: cfContactName, email: cfContactEmail, team: cfContactTeam } })}
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={cfContactEmail}
                      onChange={(e) => updateStoreSettings({ cloudflareContact: { email: e.target.value, name: cfContactName, role: cfContactRole, team: cfContactTeam } })}
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Team</Label>
                    <Input
                      value={cfContactTeam}
                      onChange={(e) => updateStoreSettings({ cloudflareContact: { team: e.target.value, name: cfContactName, role: cfContactRole, email: cfContactEmail } })}
                      className="bg-secondary/50"
                    />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-500" />
                    Customer Contact
                  </CardTitle>
                  <CardDescription>Primary customer stakeholder details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Customer Name</Label>
                    <Input
                      value={custCustomerName}
                      onChange={(e) => updateStoreSettings({ customerContact: { customerName: e.target.value, name: custContactName, role: custContactRole, email: custContactEmail } })}
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={custContactName}
                      onChange={(e) => updateStoreSettings({ customerContact: { name: e.target.value, customerName: custCustomerName, role: custContactRole, email: custContactEmail } })}
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input
                      value={custContactRole}
                      onChange={(e) => updateStoreSettings({ customerContact: { role: e.target.value, customerName: custCustomerName, name: custContactName, email: custContactEmail } })}
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={custContactEmail}
                      onChange={(e) => updateStoreSettings({ customerContact: { email: e.target.value, customerName: custCustomerName, name: custContactName, role: custContactRole } })}
                      className="bg-secondary/50"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSave} disabled={isSaving} className="btn-gradient">
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Report Preferences
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}