import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ActiveAlerts } from "@/components/ActiveAlerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const Alerts = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Alerts & Incidents</h2>
              <p className="text-muted-foreground">Monitor and manage system alerts</p>
            </div>
            <Button className="bg-primary text-primary-foreground">
              <Bell className="w-4 h-4 mr-2" />
              Configure Alerts
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Critical</p>
                    <p className="text-3xl font-bold text-destructive">3</p>
                  </div>
                  <AlertCircle className="w-10 h-10 text-destructive" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Warnings</p>
                    <p className="text-3xl font-bold text-warning">7</p>
                  </div>
                  <AlertTriangle className="w-10 h-10 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Resolved Today</p>
                    <p className="text-3xl font-bold text-success">15</p>
                  </div>
                  <Bell className="w-10 h-10 text-success" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActiveAlerts />

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Alert Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-4 bg-background border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">CPU Threshold</h3>
                      <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">Active</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Trigger when CPU usage exceeds 80%</p>
                  </div>

                  <div className="p-4 bg-background border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Memory Alert</h3>
                      <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">Active</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Alert when memory usage is above 85%</p>
                  </div>

                  <div className="p-4 bg-background border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Response Time</h3>
                      <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">Active</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Warn if response time exceeds 500ms</p>
                  </div>

                  <div className="p-4 bg-background border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Failed Deployments</h3>
                      <span className="text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded">Paused</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Alert on any deployment failure</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Alerts;
