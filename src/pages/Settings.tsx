import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useAppState } from "@/context/AppContext";
import Layout from "@/components/Layout";
import { Settings, Bell, Palette, Clock, Sun, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { profile, setProfile, setTasks, setTimetable } = useAppState();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [pomodoroLength, setPomodoroLength] = useState("25");
  const [breakLength, setBreakLength] = useState("5");

  const clearAllData = () => {
    localStorage.clear();
    setTasks([]);
    setTimetable([]);
    setProfile({ ...profile, name: "", email: "", goals: [] });
    toast({ title: "Data cleared", description: "All data has been reset." });
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Customize your StudyFlow experience</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-6 border border-border space-y-6"
        >
          <h2 className="font-semibold flex items-center gap-2">
            <Palette size={18} className="text-primary" /> Appearance
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon size={20} className="text-primary" />
              ) : (
                <Sun size={20} className="text-primary" />
              )}
              <div>
                <Label>Theme</Label>
                <p className="text-xs text-muted-foreground">
                  {theme === "dark" ? "Dark mode" : "Light mode"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className="h-8 w-8 p-0"
              >
                <Sun size={16} />
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="h-8 w-8 p-0"
              >
                <Moon size={16} />
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-xl p-6 border border-border space-y-6"
        >
          <h2 className="font-semibold flex items-center gap-2">
            <Bell size={18} className="text-primary" /> Notifications
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <Label>Study Reminders</Label>
              <p className="text-xs text-muted-foreground">Get notified before each study session</p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl p-6 border border-border space-y-6"
        >
          <h2 className="font-semibold flex items-center gap-2">
            <Clock size={18} className="text-primary" /> Study Preferences
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pomodoro Length</Label>
              <Select value={pomodoroLength} onValueChange={setPomodoroLength}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 min</SelectItem>
                  <SelectItem value="25">25 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Break Length</Label>
              <Select value={breakLength} onValueChange={setBreakLength}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="10">10 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-xl p-6 border border-destructive/20 space-y-4"
        >
          <h2 className="font-semibold text-destructive">Danger Zone</h2>
          <p className="text-sm text-muted-foreground">This will clear all your tasks, timetables, and history.</p>
          <Button variant="destructive" onClick={clearAllData}>Clear All Data</Button>
        </motion.div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
