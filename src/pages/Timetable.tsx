import { useState } from "react";
import { motion } from "framer-motion";
import { useAppState } from "@/context/AppContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wand2, Clock, BookOpen, Coffee, Dumbbell, User, Save, Trash2, History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const typeIcons: Record<string, React.ReactNode> = {
  study: <BookOpen size={16} />,
  break: <Coffee size={16} />,
  meal: <Coffee size={16} />,
  exercise: <Dumbbell size={16} />,
  personal: <User size={16} />,
};

const typeStyles: Record<string, string> = {
  study: "border-l-primary bg-primary/5 dark:bg-primary/10 dark:text-foreground",
  break: "border-l-accent bg-accent/5 dark:bg-accent/10 dark:text-foreground",
  meal: "border-l-beige-warm bg-beige-warm/30 dark:bg-beige-warm/40 dark:text-foreground",
  exercise: "border-l-primary bg-secondary dark:bg-secondary dark:text-secondary-foreground",
  personal: "border-l-accent bg-purple-soft dark:bg-purple-soft/30 dark:text-foreground",
};

const TimetablePage = () => {
  const {
    timetable,
    generateTimetable,
    tasks,
    savedTimetables,
    saveCurrentTimetable,
    loadTimetable,
    deleteSavedTimetable,
  } = useAppState();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [timetableName, setTimetableName] = useState("");

  const handleSave = () => {
    if (timetable.length === 0) return;
    saveCurrentTimetable(timetableName.trim() || undefined);
    setTimetableName("");
    setSaveDialogOpen(false);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Your Timetable</h1>
            <p className="text-sm text-muted-foreground">
              Auto-generated from your tasks and preferences. Adds today’s college classes and fits study around them.
            </p>
          </div>
          <div className="flex gap-2">
            {timetable.length > 0 && (
              <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Save size={16} className="mr-2" />
                    Save
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Timetable</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Timetable name (optional)"
                      value={timetableName}
                      onChange={(e) => setTimetableName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    />
                    <Button onClick={handleSave} className="w-full">
                      Save Timetable
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button
              onClick={generateTimetable}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Wand2 size={16} className="mr-2" />
              {timetable.length > 0 ? "Regenerate" : "Generate"}
            </Button>
          </div>
        </div>

        {savedTimetables.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <div className="flex items-center gap-2 mb-3">
              <History size={18} className="text-primary" />
              <h2 className="font-semibold text-sm">Saved Timetables</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedTimetables.map((saved) => (
                <div
                  key={saved.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-border"
                >
                  <button
                    onClick={() => loadTimetable(saved.id)}
                    className="text-sm hover:text-primary transition-colors"
                  >
                    {saved.name}
                  </button>
                  <button
                    onClick={() => deleteSavedTimetable(saved.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Delete timetable"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {tasks.length === 0 && timetable.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Clock size={40} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">Add tasks first</p>
            <p className="text-sm">Go to Tasks page to add your study tasks, then come back to generate a timetable.</p>
          </div>
        )}

        {timetable.length > 0 && (
          <div className="space-y-2">
            {timetable.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-4 p-4 rounded-xl border border-l-4 bg-card text-card-foreground ${typeStyles[entry.type] || ""}`}
              >
                <div className="text-muted-foreground dark:text-muted-foreground shrink-0">{typeIcons[entry.type]}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground dark:text-foreground">{entry.task}</p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">{entry.subject}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground dark:text-foreground">{entry.time}</p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">to {entry.endTime}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TimetablePage;
