import { Bell, LogOut, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useAuth } from "@/hooks/use-auth";

export const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search services, logs, metrics..."
            className="pl-10 bg-background border-border"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </Button>

        <div className="hidden text-right md:block">
          <p className="text-sm font-medium text-foreground">{user?.name || user?.email}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{user?.role || "operator"}</p>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <span className="text-muted-foreground">All Systems Operational</span>
        </div>

        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
};
