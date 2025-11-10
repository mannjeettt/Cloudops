import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ContainerStats } from "@/components/ContainerStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container, Play, Square, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const Containers = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Container Management</h2>
              <p className="text-muted-foreground">Docker and Kubernetes orchestration</p>
            </div>
            <Button className="bg-primary text-primary-foreground">
              <Play className="w-4 h-4 mr-2" />
              Deploy New Container
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Containers</p>
                    <p className="text-3xl font-bold">28</p>
                  </div>
                  <Container className="w-10 h-10 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Running</p>
                    <p className="text-3xl font-bold text-success">24</p>
                  </div>
                  <Play className="w-10 h-10 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Stopped</p>
                    <p className="text-3xl font-bold text-muted-foreground">4</p>
                  </div>
                  <Square className="w-10 h-10 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ContainerStats />

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Container Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-background border border-border rounded-lg">
                    <h3 className="font-medium mb-2">nginx-proxy</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <RotateCw className="w-4 h-4 mr-2" />
                        Restart
                      </Button>
                      <Button variant="outline" size="sm">
                        <Square className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                      <Button variant="outline" size="sm">View Logs</Button>
                    </div>
                  </div>

                  <div className="p-4 bg-background border border-border rounded-lg">
                    <h3 className="font-medium mb-2">postgres-db</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <RotateCw className="w-4 h-4 mr-2" />
                        Restart
                      </Button>
                      <Button variant="outline" size="sm">
                        <Square className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                      <Button variant="outline" size="sm">View Logs</Button>
                    </div>
                  </div>

                  <div className="p-4 bg-background border border-border rounded-lg">
                    <h3 className="font-medium mb-2">redis-session</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <RotateCw className="w-4 h-4 mr-2" />
                        Restart
                      </Button>
                      <Button variant="outline" size="sm">
                        <Square className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                      <Button variant="outline" size="sm">View Logs</Button>
                    </div>
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

export default Containers;
