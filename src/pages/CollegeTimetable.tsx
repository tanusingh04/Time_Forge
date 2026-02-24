import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppState } from "@/context/AppContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { School, Plus, Trash2 } from "lucide-react";

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const CollegeTimetablePage = () => {
  const { collegeTimetable, addCollegeSlot, removeCollegeSlot, syllabusFiles } = useAppState();
  const [day, setDay] = useState<string>("1");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:30");
  const [subject, setSubject] = useState("");
  const [roomOrCode, setRoomOrCode] = useState("");

  const syllabusSubjects = Array.from(
    new Set(syllabusFiles.filter((f) => f.subject).map((f) => f.subject!))
  ).sort();

  const handleAdd = () => {
    if (!subject.trim()) return;
    const start = startTime;
    const end = endTime;
    if (start >= end) return;
    addCollegeSlot({
      day: parseInt(day, 10),
      startTime: start,
      endTime: end,
      subject: subject.trim(),
      roomOrCode: roomOrCode.trim() || undefined,
    });
    setSubject("");
    setRoomOrCode("");
    setStartTime("09:00");
    setEndTime("10:30");
  };

  const byDay = DAYS.map((d) => ({
    ...d,
    slots: collegeTimetable.filter((s) => s.day === d.value).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">College Timetable</h1>
          <p className="text-sm text-muted-foreground">
            Add your weekly college classes so your study timetable fits around them
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-6 border border-border space-y-4"
        >
          <h2 className="font-semibold flex items-center gap-2">
            <Plus size={18} className="text-primary" /> Add Class
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Select value={day} onValueChange={setDay}>
              <SelectTrigger>
                <SelectValue placeholder="Day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => (
                  <SelectItem key={d.value} value={String(d.value)}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            {syllabusSubjects.length > 0 ? (
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm md:col-span-2"
              >
                <option value="">Select subject</option>
                {syllabusSubjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <Input
                placeholder="Subject / Course"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="md:col-span-2"
              />
            )}
            <Input
              placeholder="Room or code (optional)"
              value={roomOrCode}
              onChange={(e) => setRoomOrCode(e.target.value)}
              className="md:col-span-2"
            />
          </div>
          <Button
            onClick={handleAdd}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!subject.trim() || startTime >= endTime}
          >
            <Plus size={16} className="mr-2" /> Add Class
          </Button>
        </motion.div>

        <div className="space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <School size={18} className="text-primary" /> Weekly Schedule
          </h2>
          {collegeTimetable.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No classes added. Add your college schedule above so your study timetable avoids those times.
            </p>
          ) : (
            <div className="space-y-4">
              {byDay.map(
                (d) =>
                  d.slots.length > 0 && (
                    <div key={d.value} className="rounded-xl border bg-card overflow-hidden">
                      <div className="px-4 py-2 bg-muted/50 font-medium text-sm">
                        {d.label}
                      </div>
                      <div className="divide-y">
                        <AnimatePresence>
                          {d.slots.map((slot) => (
                            <motion.div
                              key={slot.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-4 px-4 py-3"
                            >
                              <span className="text-sm font-mono text-muted-foreground w-24 shrink-0">
                                {slot.startTime} – {slot.endTime}
                              </span>
                              <span className="font-medium">{slot.subject}</span>
                              {slot.roomOrCode && (
                                <span className="text-sm text-muted-foreground">
                                  {slot.roomOrCode}
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="ml-auto shrink-0 text-destructive hover:text-destructive"
                                onClick={() => removeCollegeSlot(slot.id)}
                                aria-label="Remove class"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CollegeTimetablePage;
