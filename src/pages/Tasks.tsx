import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppState } from "@/context/AppContext";
import Layout from "@/components/Layout";
import { Plus, Trash2, CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TasksPage = () => {
  const { tasks, addTask, removeTask, toggleTask, syllabusFiles } = useAppState();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [useCustomSubject, setUseCustomSubject] = useState(false);
  const [duration, setDuration] = useState("45");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

  // Get unique subjects from uploaded syllabus files
  const syllabusSubjects = Array.from(
    new Set(syllabusFiles.filter((f) => f.subject).map((f) => f.subject!))
  ).sort();

  const handleAdd = () => {
    const finalSubject = useCustomSubject ? customSubject.trim() : subject.trim();
    if (!title.trim() || !finalSubject) return;
    addTask({ title: title.trim(), subject: finalSubject, duration: parseInt(duration), priority });
    setTitle("");
    setSubject("");
    setCustomSubject("");
    setUseCustomSubject(false);
    setDuration("45");
    setPriority("medium");
  };

  const priorityConfig = {
    high: { label: "High", color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
    medium: { label: "Medium", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
    low: { label: "Low", color: "text-muted-foreground", bg: "bg-muted border-border" },
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-muted-foreground">Add your study tasks and they'll be scheduled in your timetable</p>
        </div>

        {/* Add Task Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-6 border border-border space-y-4"
        >
          <h2 className="font-semibold flex items-center gap-2">
            <Plus size={18} className="text-primary" /> Add New Task
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="Task title (e.g., Revise Calculus Ch.3)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <div className="space-y-2">
              {syllabusSubjects.length > 0 && !useCustomSubject ? (
                <>
                  <Select
                    value={subject === "__custom__" ? "" : subject}
                    onValueChange={(value) => {
                      if (value === "__custom__") {
                        setUseCustomSubject(true);
                        setSubject("");
                      } else {
                        setSubject(value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject from syllabus" />
                    </SelectTrigger>
                    <SelectContent>
                      {syllabusSubjects.map((subj) => (
                        <SelectItem key={subj} value={subj}>
                          {subj}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__" className="text-primary font-medium">
                        + Add Custom Subject
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {subject && subject !== "__custom__" && (
                    <p className="text-xs text-muted-foreground">
                      Selected: <span className="font-medium">{subject}</span>
                    </p>
                  )}
                </>
              ) : (
                <>
                  <Input
                    placeholder="Subject (e.g., Mathematics)"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                  />
                  {syllabusSubjects.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUseCustomSubject(false);
                        setCustomSubject("");
                        setSubject("");
                      }}
                      className="text-xs h-6 w-full"
                    >
                      ← Select from syllabus instead
                    </Button>
                  )}
                </>
              )}
            </div>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 min (Pomodoro)</SelectItem>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={(v) => setPriority(v as "high" | "medium" | "low")}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">🔴 High Priority</SelectItem>
                <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                <SelectItem value="low">🟢 Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus size={16} className="mr-2" /> Add Task
          </Button>
        </motion.div>

        {/* Task List */}
        <div className="space-y-2">
          <AnimatePresence>
            {tasks.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-muted-foreground"
              >
                <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tasks yet. Add your first task above!</p>
              </motion.div>
            )}
            {tasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-xl border bg-card ${
                  task.completed ? "opacity-60" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.completed ? "line-through" : ""}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {task.subject} • {task.duration} min
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${priorityConfig[task.priority].bg}`}>
                  {priorityConfig[task.priority].label}
                </span>
                {!task.completed && (
                  <Button
                    onClick={() => toggleTask(task.id)}
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <CheckCircle2 size={16} className="mr-1.5" />
                    Mark Done
                  </Button>
                )}
                {task.completed && (
                  <Button
                    onClick={() => toggleTask(task.id)}
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground"
                  >
                    <Circle size={16} className="mr-1.5" />
                    Undo
                  </Button>
                )}
                <button onClick={() => removeTask(task.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
};

export default TasksPage;
