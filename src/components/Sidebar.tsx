import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  ListTodo,
  Calendar,
  User,
  Settings,
  History,
  FileText,
  Bot,
  School,
  ClipboardList,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: ListTodo, label: "Tasks", path: "/tasks" },
  { icon: Calendar, label: "Timetable", path: "/timetable" },
  { icon: School, label: "College Timetable", path: "/college-timetable" },
  { icon: ClipboardList, label: "Exams", path: "/exams" },
  { icon: History, label: "History", path: "/history" },
  { icon: FileText, label: "Syllabus", path: "/syllabus" },
  { icon: Bot, label: "AI Chat", path: "/chat" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const Sidebar = () => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6">
      <h1 className="text-2xl font-bold text-sidebar-foreground">
          <span className="text-sidebar-primary">Time</span>Forge
        </h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">Forge your perfect day</p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow-purple"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mx-3 mb-4 rounded-lg bg-sidebar-accent">
        <p className="text-xs text-sidebar-foreground/70">💡 Tip: Add your tasks first, then generate a timetable!</p>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {theme === "dark" ? (
            <>
              <Sun size={16} className="mr-2" />
              Light Mode
            </>
          ) : (
            <>
              <Moon size={16} className="mr-2" />
              Dark Mode
            </>
          )}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
