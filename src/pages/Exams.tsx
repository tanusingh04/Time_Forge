import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppState } from "@/context/AppContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Plus, Trash2, ClipboardList } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ExamsPage = () => {
  const { exams, addExam, removeExam, syllabusFiles } = useAppState();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const syllabusSubjects = Array.from(
    new Set(syllabusFiles.filter((f) => f.subject).map((f) => f.subject!))
  ).sort();

  const handleAdd = () => {
    if (!title.trim() || !subject.trim() || !date.trim()) return;
    addExam({
      title: title.trim(),
      subject: subject.trim(),
      date: date.trim(),
      time: time.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setTitle("");
    setSubject("");
    setDate("");
    setTime("");
    setNotes("");
  };

  const upcomingExams = exams.filter((e) => e.date >= new Date().toISOString().split("T")[0]);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Exams</h1>
          <p className="text-sm text-muted-foreground">
            Add exam dates so your timetable can avoid conflicts and prioritize revision
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-6 border border-border space-y-4"
        >
          <h2 className="font-semibold flex items-center gap-2">
            <Plus size={18} className="text-primary" /> Add Exam
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Exam title (e.g., Midterm)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex gap-2">
              {syllabusSubjects.length > 0 ? (
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select subject</option>
                  {syllabusSubjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <Input
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              )}
            </div>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              type="time"
              placeholder="Time (optional)"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <Input
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="md:col-span-2"
            />
          </div>
          <Button
            onClick={handleAdd}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!title.trim() || !subject.trim() || !date.trim()}
          >
            <Plus size={16} className="mr-2" /> Add Exam
          </Button>
        </motion.div>

        <div className="space-y-2">
          <h2 className="font-semibold flex items-center gap-2">
            <ClipboardList size={18} className="text-primary" /> Upcoming Exams
          </h2>
          <AnimatePresence>
            {upcomingExams.length === 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted-foreground py-6 text-center"
              >
                No upcoming exams. Add one above.
              </motion.p>
            )}
            {upcomingExams.map((exam, i) => {
              const d = new Date(exam.date);
              const dayName = DAYS[d.getDay()];
              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-4 p-4 rounded-xl border bg-card"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Calendar size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{exam.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {exam.subject} · {exam.date} {dayName}
                      {exam.time && ` · ${exam.time}`}
                    </p>
                    {exam.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{exam.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExam(exam.id)}
                    className="shrink-0 text-destructive hover:text-destructive"
                    aria-label="Remove exam"
                  >
                    <Trash2 size={18} />
                  </Button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
};

export default ExamsPage;
