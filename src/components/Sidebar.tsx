import { LayoutDashboard, Activity, GitBranch, Container, AlertTriangle, Settings, Cloud } from "lucide-react";
import { NavLink } from "./NavLink";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Activity, label: "Monitoring", path: "/monitoring" },
  { icon: GitBranch, label: "CI/CD", path: "/cicd" },
  { icon: Container, label: "Containers", path: "/containers" },
  { icon: AlertTriangle, label: "Alerts", path: "/alerts" },
  { icon: Cloud, label: "Cloud Services", path: "/cloud" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Cloud className="w-7 h-7" />
          CloudOps
        </h1>
        <p className="text-xs text-muted-foreground mt-1">DevOps Monitoring Platform</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                activeClassName="bg-sidebar-accent text-primary font-medium"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3 bg-sidebar-accent rounded-lg">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-semibold">AD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">Admin User</p>
            <p className="text-xs text-muted-foreground truncate">admin@cloudops.io</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
