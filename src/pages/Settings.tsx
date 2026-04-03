import { Bell, Loader2, Palette, Save, Shield, User } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  useSettingsQuery,
  useUpdateSettingsMutation,
  useUpdateSystemSettingsMutation,
} from "@/hooks/use-cloudops-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const Settings = () => {
  const { updateUser } = useAuth();
  const { data, isLoading } = useSettingsQuery();
  const updateSettingsMutation = useUpdateSettingsMutation();
  const updateSystemSettingsMutation = useUpdateSystemSettingsMutation();
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [preferences, setPreferences] = useState({
    notifications: true,
    theme: "light",
    timezone: "UTC",
    email_alerts: true,
    dashboard_refresh_interval: 30,
  });
  const [systemSettings, setSystemSettings] = useState({
    maintenance_mode: false,
    max_users: 100,
    data_retention_days: 90,
    backup_frequency: "daily",
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    setProfile({
      name: data.profile.name,
      email: data.profile.email,
    });
    setPreferences(data.preferences);

    if (data.systemSettings) {
      setSystemSettings(data.systemSettings);
    }
  }, [data]);

  const saveProfileAndPreferences = async () => {
    const response = await updateSettingsMutation.mutateAsync({
      profile: {
        ...data?.profile,
        ...profile,
      },
      preferences,
    });

    if (response && typeof response === "object" && "profile" in response) {
      updateUser(response.profile as Parameters<typeof updateUser>[0]);
    }
  };

  const saveSystemSettings = async () => {
    await updateSystemSettingsMutation.mutateAsync(systemSettings);
  };

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">Loading settings...</div>;
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-foreground mb-2">Settings</h2>
        <p className="text-muted-foreground">Manage account access, notification preferences, and environment controls.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-5xl">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Profile Settings
            </CardTitle>
            <CardDescription>Persistent login is tied to your current account token and profile record.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={data?.profile.role || "user"} disabled className="mt-1 uppercase" />
            </div>
            <Button className="bg-primary text-primary-foreground" onClick={() => void saveProfileAndPreferences()} disabled={updateSettingsMutation.isPending}>
              {updateSettingsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Critical Alerts</p>
                <p className="text-sm text-muted-foreground">Receive notifications for critical system issues</p>
              </div>
              <Switch checked={preferences.notifications} onCheckedChange={(checked) => setPreferences((current) => ({ ...current, notifications: checked }))} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Alerts</p>
                <p className="text-sm text-muted-foreground">Send alert digests and urgent issues to your inbox</p>
              </div>
              <Switch checked={preferences.email_alerts} onCheckedChange={(checked) => setPreferences((current) => ({ ...current, email_alerts: checked }))} />
            </div>
            <div>
              <Label htmlFor="refresh-interval">Dashboard Refresh Interval (seconds)</Label>
              <Input
                id="refresh-interval"
                type="number"
                min={5}
                value={preferences.dashboard_refresh_interval}
                onChange={(event) => setPreferences((current) => ({ ...current, dashboard_refresh_interval: Number(event.target.value) }))}
                className="mt-1 max-w-xs"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Security and Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
              <div>
                <p className="font-medium">Persistent Login</p>
                <p className="text-sm text-muted-foreground">Your session is restored from the saved access token after refresh.</p>
              </div>
              <span className="text-sm text-success">Enabled</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
              <div>
                <p className="font-medium">Role-based Access</p>
                <p className="text-sm text-muted-foreground">Protected routes and admin-only controls follow your assigned role.</p>
              </div>
              <span className="text-sm text-muted-foreground uppercase">{data?.profile.role}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="theme">Theme</Label>
              <Input id="theme" value={preferences.theme} onChange={(event) => setPreferences((current) => ({ ...current, theme: event.target.value }))} className="mt-1 max-w-xs" />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" value={preferences.timezone} onChange={(event) => setPreferences((current) => ({ ...current, timezone: event.target.value }))} className="mt-1 max-w-xs" />
            </div>
          </CardContent>
        </Card>

        {data?.systemSettings ? (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Admin Environment Controls
              </CardTitle>
              <CardDescription>Only admin users can see and update these controls.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">Broadcast planned maintenance status to connected clients.</p>
                </div>
                <Switch checked={systemSettings.maintenance_mode} onCheckedChange={(checked) => setSystemSettings((current) => ({ ...current, maintenance_mode: checked }))} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="max-users">Max Users</Label>
                  <Input id="max-users" type="number" value={systemSettings.max_users} onChange={(event) => setSystemSettings((current) => ({ ...current, max_users: Number(event.target.value) }))} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="retention">Retention Days</Label>
                  <Input id="retention" type="number" value={systemSettings.data_retention_days} onChange={(event) => setSystemSettings((current) => ({ ...current, data_retention_days: Number(event.target.value) }))} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="backup-frequency">Backup Frequency</Label>
                  <Input id="backup-frequency" value={systemSettings.backup_frequency} onChange={(event) => setSystemSettings((current) => ({ ...current, backup_frequency: event.target.value }))} className="mt-1" />
                </div>
              </div>
              <Button variant="outline" onClick={() => void saveSystemSettings()} disabled={updateSystemSettingsMutation.isPending}>
                {updateSystemSettingsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save System Settings
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
};

export default Settings;
