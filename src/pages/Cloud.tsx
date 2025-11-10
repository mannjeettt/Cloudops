import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud as CloudIcon, Server, Database, HardDrive } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Cloud = () => {
  const cloudProviders = [
    { name: "AWS", status: "connected", services: 12 },
    { name: "Azure", status: "connected", services: 8 },
    { name: "GCP", status: "disconnected", services: 0 },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-foreground mb-2">Cloud Services</h2>
            <p className="text-muted-foreground">Multi-cloud infrastructure management</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {cloudProviders.map((provider, index) => (
              <Card key={index} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <CloudIcon className="w-8 h-8 text-primary" />
                    <span className={`text-xs px-2 py-1 rounded ${
                      provider.status === "connected" 
                        ? "bg-success/10 text-success" 
                        : "bg-muted/50 text-muted-foreground"
                    }`}>
                      {provider.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{provider.name}</h3>
                  <p className="text-sm text-muted-foreground">{provider.services} services</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Compute Instances</span>
                      </div>
                      <span className="text-sm text-muted-foreground">24 / 50</span>
                    </div>
                    <Progress value={48} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-success" />
                        <span className="text-sm font-medium">Database Instances</span>
                      </div>
                      <span className="text-sm text-muted-foreground">8 / 20</span>
                    </div>
                    <Progress value={40} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-warning" />
                        <span className="text-sm font-medium">Storage (TB)</span>
                      </div>
                      <span className="text-sm text-muted-foreground">4.2 / 10</span>
                    </div>
                    <Progress value={42} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Active Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { service: "EC2 Instances", provider: "AWS", count: 15 },
                    { service: "RDS Databases", provider: "AWS", count: 4 },
                    { service: "S3 Buckets", provider: "AWS", count: 12 },
                    { service: "Virtual Machines", provider: "Azure", count: 8 },
                    { service: "Blob Storage", provider: "Azure", count: 6 },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                      <div>
                        <p className="font-medium">{item.service}</p>
                        <p className="text-xs text-muted-foreground">{item.provider}</p>
                      </div>
                      <span className="text-sm font-semibold text-primary">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Cloud;
