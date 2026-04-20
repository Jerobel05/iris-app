import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import {
  Home, Mail, CheckSquare, BarChart2, Sun, Moon, Settings, LogOut, Menu,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem { icon: ReactNode; label: string; path: string; }

const navItems: NavItem[] = [
  { icon: <Home size={18} />, label: "Accueil", path: "/home" },
  { icon: <Mail size={18} />, label: "E-mails", path: "/emails" },
  { icon: <CheckSquare size={18} />, label: "Tâches", path: "/tasks" },
  { icon: <BarChart2 size={18} />, label: "Analyses", path: "/analysis" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className={`flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${sidebarCollapsed ? "w-14" : "w-44"}`}>
        {/* Top */}
        <div className="flex flex-col items-center pt-4 pb-2 gap-3">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
            <Menu size={18} />
          </button>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">
              {user?.full_name ? user.full_name[0].toUpperCase() : user?.email[0].toUpperCase()}
            </span>
          </div>
          {!sidebarCollapsed && (
            <p className="text-xs text-sidebar-foreground/80 font-medium text-center truncate px-2 max-w-full">
              {user?.full_name || user?.email?.split("@")[0]}
            </p>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 px-2 mt-1 flex-1">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 w-full text-left ${isActive ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
                {item.icon}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="mx-3 my-2 h-px bg-sidebar-border/50" />

        {/* Bottom nav */}
        <div className="flex flex-col gap-1 px-2 pb-4">
          <button onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full text-left">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            {!sidebarCollapsed && <span>{theme === "dark" ? "Mode clair" : "Mode sombre"}</span>}
          </button>
          <button onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full text-left">
            <Settings size={18} />
            {!sidebarCollapsed && <span>Paramètres</span>}
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors w-full text-left">
            <LogOut size={18} />
            {!sidebarCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto relative p-6">
        {children}
      </main>

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
