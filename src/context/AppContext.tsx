import React, { createContext, useContext, useState, useEffect } from "react";
import { saveFileToDB, getFileFromDB, deleteFileFromDB } from "@/lib/indexedDB";

export interface StudentProfile {
  name: string;
  email: string;
  institution: string;
  course: string;
  semester: string;
  studyHoursPerDay: number;
  wakeUpTime: string;
  sleepTime: string;
  goals: string[];
}

export interface Task {
  id: string;
  title: string;
  subject: string;
  duration: number; // in minutes
  priority: "high" | "medium" | "low";
  completed: boolean;
  scheduledTime?: string;
}

export interface TimetableEntry {
  id: string;
  time: string;
  endTime: string;
  task: string;
  subject: string;
  type: "study" | "break" | "meal" | "exercise" | "personal";
}

export interface DayRecord {
  date: string;
  timetable: TimetableEntry[];
  completionRate: number;
}

export interface SavedTimetable {
  id: string;
  name: string;
  entries: TimetableEntry[];
  createdAt: string;
}

export interface SubjectModule {
  id: string;
  name: string;
  estimatedHours?: number;
}

export interface SyllabusFile {
  id?: string;
  name: string;
  subject?: string;
  uploadedAt: string;
  url?: string;
  modules?: SubjectModule[];
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  date: string; // ISO date YYYY-MM-DD
  time?: string; // optional e.g. "09:00"
  notes?: string;
}

export interface CollegeSlot {
  id: string;
  day: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  startTime: string; // "09:00"
  endTime: string;   // "10:30"
  subject: string;
  roomOrCode?: string;
}

interface AppState {
  profile: StudentProfile;
  setProfile: (p: StudentProfile) => void;
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  addTask: (t: Omit<Task, "id" | "completed">) => void;
  removeTask: (id: string) => void;
  toggleTask: (id: string) => void;
  timetable: TimetableEntry[];
  setTimetable: (t: TimetableEntry[]) => void;
  generateTimetable: () => void;
  savedTimetables: SavedTimetable[];
  setSavedTimetables: (t: SavedTimetable[]) => void;
  saveCurrentTimetable: (name?: string) => void;
  loadTimetable: (id: string) => void;
  deleteSavedTimetable: (id: string) => void;
  history: DayRecord[];
  syllabusFiles: SyllabusFile[];
  addSyllabusFile: (file: Pick<SyllabusFile, "name" | "subject" | "url">, blob?: Blob) => void;
  removeSyllabusFile: (index: number) => void;
  addModuleToSubject: (subjectIndex: number, module: Omit<SubjectModule, "id">) => void;
  removeModuleFromSubject: (subjectIndex: number, moduleId: string) => void;
  updateSyllabusFile: (index: number, updates: Partial<SyllabusFile>) => void;
  exams: Exam[];
  addExam: (exam: Omit<Exam, "id">) => void;
  removeExam: (id: string) => void;
  collegeTimetable: CollegeSlot[];
  addCollegeSlot: (slot: Omit<CollegeSlot, "id">) => void;
  removeCollegeSlot: (id: string) => void;
}

const defaultProfile: StudentProfile = {
  name: "",
  email: "",
  institution: "",
  course: "",
  semester: "",
  studyHoursPerDay: 6,
  wakeUpTime: "06:00",
  sleepTime: "22:00",
  goals: [],
};

const AppContext = createContext<AppState | null>(null);

export const useAppState = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
};

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfileState] = useState<StudentProfile>(() =>
    loadFromStorage("student-profile", defaultProfile)
  );
  const [tasks, setTasksState] = useState<Task[]>(() =>
    loadFromStorage("student-tasks", [])
  );
  const [timetable, setTimetableState] = useState<TimetableEntry[]>(() =>
    loadFromStorage("student-timetable", [])
  );
  const [savedTimetables, setSavedTimetablesState] = useState<SavedTimetable[]>(() =>
    loadFromStorage<SavedTimetable[]>("student-saved-timetables", [])
  );
  const [regenerationCount, setRegenerationCount] = useState(() =>
    loadFromStorage("regeneration-count", 0)
  );
  const [history, setHistory] = useState<DayRecord[]>(() =>
    loadFromStorage("student-history", [])
  );
  const [syllabusFiles, setSyllabusFiles] = useState<SyllabusFile[]>(() =>
    loadFromStorage<SyllabusFile[]>("student-syllabus", [])
  );
  const [exams, setExamsState] = useState<Exam[]>(() =>
    loadFromStorage<Exam[]>("student-exams", [])
  );
  const [collegeTimetable, setCollegeTimetableState] = useState<CollegeSlot[]>(() =>
    loadFromStorage<CollegeSlot[]>("student-college-timetable", [])
  );

  useEffect(() => {
    let changed = false;
    const restoreURLs = async () => {
      const updatedFiles = await Promise.all(
        syllabusFiles.map(async (file) => {
          if (file.id && (!file.url || file.url.startsWith('blob:'))) {
            try {
              const blob = await getFileFromDB(file.id);
              if (blob) {
                changed = true;
                return { ...file, url: URL.createObjectURL(blob) };
              }
            } catch (e) {
              console.error("Failed to recover PDF file from indexedDB", e);
            }
          }
          return file;
        })
      );
      if (changed) {
        setSyllabusFiles(updatedFiles);
      }
    };

    if (syllabusFiles.length > 0) {
      restoreURLs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setProfile = (p: StudentProfile) => {
    setProfileState(p);
    localStorage.setItem("student-profile", JSON.stringify(p));
  };

  const setTasks = (t: Task[]) => {
    setTasksState(t);
    localStorage.setItem("student-tasks", JSON.stringify(t));

    // Synchronize current date's history record with the new completion rate.
    // Use the functional form of setHistory to always get the latest history state
    // and avoid stale closure bugs.
    const today = new Date().toISOString().split("T")[0];
    const completedCount = t.filter((task) => task.completed).length;
    const rate = t.length > 0 ? Math.round((completedCount / t.length) * 100) : 0;

    setHistory((prevHistory) => {
      const todayRecord = prevHistory.find((h) => h.date === today);
      if (!todayRecord) return prevHistory; // No history for today yet, nothing to update

      const updatedRecord = { ...todayRecord, completionRate: rate };
      const updatedHistory = [...prevHistory.filter((h) => h.date !== today), updatedRecord];
      localStorage.setItem("student-history", JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  };

  const setTimetable = (t: TimetableEntry[]) => {
    setTimetableState(t);
    localStorage.setItem("student-timetable", JSON.stringify(t));
  };

  const setSavedTimetables = (t: SavedTimetable[]) => {
    setSavedTimetablesState(t);
    localStorage.setItem("student-saved-timetables", JSON.stringify(t));
  };

  const saveCurrentTimetable = (name?: string) => {
    if (timetable.length === 0) return;
    const newSaved: SavedTimetable = {
      id: crypto.randomUUID(),
      name: name || `Timetable ${new Date().toLocaleDateString()}`,
      entries: [...timetable],
      createdAt: new Date().toISOString(),
    };
    setSavedTimetables([...savedTimetables, newSaved]);
  };

  const loadTimetable = (id: string) => {
    const saved = savedTimetables.find((t) => t.id === id);
    if (saved) {
      setTimetable(saved.entries);
    }
  };

  const deleteSavedTimetable = (id: string) => {
    setSavedTimetables(savedTimetables.filter((t) => t.id !== id));
  };

  const addTask = (t: Omit<Task, "id" | "completed">) => {
    const newTask: Task = { ...t, id: crypto.randomUUID(), completed: false };
    const updated = [...tasks, newTask];
    setTasks(updated); // Syncing will automatically occur via setTasks
  };

  const removeTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated); // Syncing will automatically occur via setTasks
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    setTasks(updated); // Syncing will automatically occur via setTasks
  };

  const addSyllabusFile = async (file: Pick<SyllabusFile, "name" | "subject" | "url">, blob?: Blob) => {
    const fileId = crypto.randomUUID();
    if (blob) {
      try {
        await saveFileToDB(fileId, blob);
      } catch (e) {
        console.error("Failed to save PDF to indexedDB", e);
      }
    }

    const updated = [
      ...syllabusFiles,
      {
        id: fileId,
        name: file.name,
        subject: file.subject,
        url: file.url,
        uploadedAt: new Date().toISOString(),
      },
    ];
    setSyllabusFiles(updated);
    localStorage.setItem("student-syllabus", JSON.stringify(updated));
  };

  const removeSyllabusFile = async (index: number) => {
    const fileToRemove = syllabusFiles[index];
    if (fileToRemove?.id) {
      try {
        await deleteFileFromDB(fileToRemove.id);
      } catch (e) {
        console.error("Failed to delete PDF from indexedDB", e);
      }
    }

    const updated = syllabusFiles.filter((_, i) => i !== index);
    setSyllabusFiles(updated);
    localStorage.setItem("student-syllabus", JSON.stringify(updated));
  };

  const addModuleToSubject = (subjectIndex: number, module: Omit<SubjectModule, "id">) => {
    const updated = [...syllabusFiles];
    if (!updated[subjectIndex].modules) {
      updated[subjectIndex].modules = [];
    }
    updated[subjectIndex].modules!.push({
      id: crypto.randomUUID(),
      ...module,
    });
    setSyllabusFiles(updated);
    localStorage.setItem("student-syllabus", JSON.stringify(updated));
  };

  const removeModuleFromSubject = (subjectIndex: number, moduleId: string) => {
    const updated = [...syllabusFiles];
    if (updated[subjectIndex].modules) {
      updated[subjectIndex].modules = updated[subjectIndex].modules!.filter((m) => m.id !== moduleId);
      setSyllabusFiles(updated);
      localStorage.setItem("student-syllabus", JSON.stringify(updated));
    }
  };

  const updateSyllabusFile = (index: number, updates: Partial<SyllabusFile>) => {
    const updated = [...syllabusFiles];
    updated[index] = { ...updated[index], ...updates };
    setSyllabusFiles(updated);
    localStorage.setItem("student-syllabus", JSON.stringify(updated));
  };

  const addExam = (exam: Omit<Exam, "id">) => {
    const newExam: Exam = { ...exam, id: crypto.randomUUID() };
    const updated = [...exams, newExam].sort((a, b) => a.date.localeCompare(b.date));
    setExamsState(updated);
    localStorage.setItem("student-exams", JSON.stringify(updated));
  };

  const removeExam = (id: string) => {
    const updated = exams.filter((e) => e.id !== id);
    setExamsState(updated);
    localStorage.setItem("student-exams", JSON.stringify(updated));
  };

  const addCollegeSlot = (slot: Omit<CollegeSlot, "id">) => {
    const newSlot: CollegeSlot = { ...slot, id: crypto.randomUUID() };
    const updated = [...collegeTimetable, newSlot];
    setCollegeTimetableState(updated);
    localStorage.setItem("student-college-timetable", JSON.stringify(updated));
  };

  const removeCollegeSlot = (id: string) => {
    const updated = collegeTimetable.filter((s) => s.id !== id);
    setCollegeTimetableState(updated);
    localStorage.setItem("student-college-timetable", JSON.stringify(updated));
  };

  const generateTimetable = () => {
    const parseTime = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const formatTime = (mins: number) => {
      const h = Math.floor(mins / 60) % 24;
      const m = mins % 60;
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    };

    // Increment regeneration count for variations
    const newCount = regenerationCount + 1;
    setRegenerationCount(newCount);
    localStorage.setItem("regeneration-count", JSON.stringify(newCount));

    const wakeUp = parseTime(profile.wakeUpTime || "06:00");
    const sleep = parseTime(profile.sleepTime || "22:00");
    const entries: TimetableEntry[] = [];
    let currentTime = wakeUp;
    const variationIndex = newCount % 4;

    // Efficient morning routine (shorter, optimized)
    const morningDuration = 25;
    entries.push({
      id: crypto.randomUUID(),
      time: formatTime(currentTime),
      endTime: formatTime(currentTime + morningDuration),
      task: "Morning Routine",
      subject: "Personal",
      type: "personal",
    });
    currentTime += morningDuration;

    // Exercise
    const exerciseDuration = 25;
    entries.push({
      id: crypto.randomUUID(),
      time: formatTime(currentTime),
      endTime: formatTime(currentTime + exerciseDuration),
      task: "Exercise / Yoga",
      subject: "Health",
      type: "exercise",
    });
    currentTime += exerciseDuration;

    // Breakfast
    const breakfastDuration = 20;
    entries.push({
      id: crypto.randomUUID(),
      time: formatTime(currentTime),
      endTime: formatTime(currentTime + breakfastDuration),
      task: "Breakfast",
      subject: "Meal",
      type: "meal",
    });
    currentTime += breakfastDuration;

    const todayDay = new Date().getDay();
    const collegeSlotsToday = collegeTimetable
      .filter((s) => s.day === todayDay)
      .map((s) => ({
        start: parseTime(s.startTime),
        end: parseTime(s.endTime),
        subject: s.subject,
        room: s.roomOrCode,
      }))
      .sort((a, b) => a.start - b.start);

    const isInCollegeSlot = (min: number) =>
      collegeSlotsToday.some((c) => min >= c.start && min < c.end);
    const getNextCollegeStart = (afterMin: number) =>
      collegeSlotsToday.find((c) => c.start > afterMin)?.start ?? 9999;
    const getCollegeSlotAt = (min: number) =>
      collegeSlotsToday.find((c) => min >= c.start && min < c.end);

    // Build topic-wise schedule from modules
    interface TopicEntry {
      subject: string;
      module: string;
      duration: number;
      priority: number;
    }

    const topicEntries: TopicEntry[] = [];
    const pendingTasks = tasks.filter((t) => !t.completed);

    // Track subjects that have an attached syllabus
    const subjectsWithSyllabus = new Set<string>();
    syllabusFiles.forEach((s) => {
      if (s.subject) subjectsWithSyllabus.add(s.subject.toLowerCase());
    });

    // Collect modules from syllabus files and match with tasks
    syllabusFiles.forEach((syllabus) => {
      if (!syllabus.subject) return;

      const subjectKey = syllabus.subject.toLowerCase();
      const subjectTasks = pendingTasks.filter(
        (t) => t.subject.toLowerCase() === subjectKey
      );

      if (syllabus.modules && syllabus.modules.length > 0) {
        // Syllabus has modules - use them
        syllabus.modules.forEach((module) => {
          if (subjectTasks.length > 0) {
            // Create entries for each module, linked to matching tasks
            subjectTasks.forEach((task) => {
              const moduleDuration = module.estimatedHours
                ? Math.min(module.estimatedHours * 60, task.duration)
                : task.duration;

              topicEntries.push({
                subject: syllabus.subject!,
                module: module.name,
                duration: moduleDuration,
                priority: task.priority === "high" ? 0 : task.priority === "medium" ? 1 : 2,
              });
            });
          } else {
            // No tasks for this subject, use module hours directly
            const moduleDuration = Math.min((module.estimatedHours || 1) * 60, 120);
            topicEntries.push({
              subject: syllabus.subject,
              module: module.name,
              duration: moduleDuration,
              priority: 1,
            });
          }
        });
      } else if (subjectTasks.length > 0) {
        // Syllabus exists but no modules - use tasks for this subject
        subjectTasks.forEach((task) => {
          topicEntries.push({
            subject: syllabus.subject!,
            module: task.title,
            duration: task.duration,
            priority: task.priority === "high" ? 0 : task.priority === "medium" ? 1 : 2,
          });
        });
      }
    });

    // Ensure ALL pending tasks appear at least once in the timetable.
    // Tasks whose subjects don't have a syllabus (or modules) are added directly.
    pendingTasks.forEach((task) => {
      const subjectKey = task.subject.toLowerCase();

      // If this subject has no syllabus attached, schedule the task directly.
      if (!subjectsWithSyllabus.has(subjectKey)) {
        topicEntries.push({
          subject: task.subject,
          module: task.title,
          duration: task.duration,
          priority: task.priority === "high" ? 0 : task.priority === "medium" ? 1 : 2,
        });
      }
    });

    // If still no topics (no modules and no tasks), nothing to schedule
    if (topicEntries.length === 0) {
      setTimetable(entries);
      return;
    }

    // Efficient scheduling: Group by subject, optimize time slots
    const subjectGroups = new Map<string, TopicEntry[]>();
    topicEntries.forEach((entry) => {
      if (!subjectGroups.has(entry.subject)) {
        subjectGroups.set(entry.subject, []);
      }
      subjectGroups.get(entry.subject)!.push(entry);
    });

    // Sort topics: priority first, then by subject grouping
    const sortedTopics: TopicEntry[] = [];
    const subjects = Array.from(subjectGroups.keys());

    // Variation: Different grouping strategies
    if (variationIndex === 0) {
      // Priority-based: high priority first, then group by subject
      const priorityGroups = [[], [], []] as TopicEntry[][];
      topicEntries.forEach((t) => priorityGroups[t.priority].push(t));
      priorityGroups.forEach((group) => {
        // Within priority, group by subject
        const subjMap = new Map<string, TopicEntry[]>();
        group.forEach((t) => {
          if (!subjMap.has(t.subject)) subjMap.set(t.subject, []);
          subjMap.get(t.subject)!.push(t);
        });
        subjMap.forEach((topics) => sortedTopics.push(...topics));
      });
    } else if (variationIndex === 1) {
      // Subject-first: complete one subject before moving to next
      subjects.forEach((subject) => {
        sortedTopics.push(...subjectGroups.get(subject)!);
      });
    } else if (variationIndex === 2) {
      // Interleaved: alternate between subjects for variety
      const maxLength = Math.max(...Array.from(subjectGroups.values()).map((g) => g.length));
      for (let i = 0; i < maxLength; i++) {
        subjects.forEach((subject) => {
          const topics = subjectGroups.get(subject)!;
          if (topics[i]) sortedTopics.push(topics[i]);
        });
      }
    } else {
      // Duration-optimized: shorter topics first for better time utilization
      sortedTopics.push(...topicEntries.sort((a, b) => a.duration - b.duration));
    }

    // Efficient scheduling with optimal break placement
    let studyBlocks = 0;
    const optimalStudyBlock = 50; // 50-minute focused study blocks
    const shortBreak = 10;
    const longBreak = 20;
    const lunchBreak = 45;

    for (const topic of sortedTopics) {
      let remainingDuration = topic.duration;

      while (remainingDuration > 0 && currentTime < sleep - 90) {
        while (isInCollegeSlot(currentTime)) {
          const slot = getCollegeSlotAt(currentTime);
          if (slot) {
            entries.push({
              id: crypto.randomUUID(),
              time: formatTime(slot.start),
              endTime: formatTime(slot.end),
              task: `College: ${slot.subject}${slot.room ? ` (${slot.room})` : ""}`,
              subject: slot.subject,
              type: "personal",
            });
            currentTime = slot.end;
          }
        }
        if (currentTime >= sleep - 90) break;

        const nextCollege = getNextCollegeStart(currentTime);
        const blockDuration = Math.min(
          remainingDuration,
          optimalStudyBlock,
          nextCollege - currentTime,
          sleep - 90 - currentTime
        );
        if (blockDuration <= 0) {
          const slot = getCollegeSlotAt(currentTime);
          if (slot) currentTime = slot.end;
          else break;
          continue;
        }

        entries.push({
          id: crypto.randomUUID(),
          time: formatTime(currentTime),
          endTime: formatTime(currentTime + blockDuration),
          task: `${topic.subject}: ${topic.module}`,
          subject: topic.subject,
          type: "study",
        });
        currentTime += blockDuration;
        remainingDuration -= blockDuration;
        studyBlocks++;

        if (remainingDuration > 0 || studyBlocks % 3 === 0) {
          if (studyBlocks >= 6 && currentTime + lunchBreak <= sleep - 60) {
            entries.push({
              id: crypto.randomUUID(),
              time: formatTime(currentTime),
              endTime: formatTime(currentTime + lunchBreak),
              task: "Lunch Break",
              subject: "Meal",
              type: "meal",
            });
            currentTime += lunchBreak;
            studyBlocks = 0;
          } else if (studyBlocks % 3 === 0) {
            entries.push({
              id: crypto.randomUUID(),
              time: formatTime(currentTime),
              endTime: formatTime(currentTime + longBreak),
              task: "Long Break",
              subject: "Rest",
              type: "break",
            });
            currentTime += longBreak;
          } else if (remainingDuration > 0) {
            entries.push({
              id: crypto.randomUUID(),
              time: formatTime(currentTime),
              endTime: formatTime(currentTime + shortBreak),
              task: "Short Break",
              subject: "Rest",
              type: "break",
            });
            currentTime += shortBreak;
          }
        }
      }
    }

    // Fill remaining time efficiently if we have space
    const remainingTime = sleep - 90 - currentTime;
    if (remainingTime > 60 && sortedTopics.length === 0) {
      const studyBlocks = Math.floor(remainingTime / (optimalStudyBlock + shortBreak));
      for (let i = 0; i < studyBlocks && currentTime + optimalStudyBlock < sleep - 90; i++) {
        entries.push({
          id: crypto.randomUUID(),
          time: formatTime(currentTime),
          endTime: formatTime(currentTime + optimalStudyBlock),
          task: `Study Block ${i + 1}`,
          subject: "General",
          type: "study",
        });
        currentTime += optimalStudyBlock;

        if (i < studyBlocks - 1) {
          entries.push({
            id: crypto.randomUUID(),
            time: formatTime(currentTime),
            endTime: formatTime(currentTime + shortBreak),
            task: "Break",
            subject: "Rest",
            type: "break",
          });
          currentTime += shortBreak;
        }
      }
    }

    // Evening wind-down (optimized timing)
    const dinnerTime = 60;
    const windDownTime = 30;

    entries.push({
      id: crypto.randomUUID(),
      time: formatTime(sleep - dinnerTime - windDownTime),
      endTime: formatTime(sleep - windDownTime),
      task: "Dinner",
      subject: "Meal",
      type: "meal",
    });
    entries.push({
      id: crypto.randomUUID(),
      time: formatTime(sleep - windDownTime),
      endTime: formatTime(sleep),
      task: "Wind Down & Reflect",
      subject: "Personal",
      type: "personal",
    });

    // Save current timetable before generating new one
    if (timetable.length > 0) {
      saveCurrentTimetable();
    }

    entries.sort((a, b) => parseTime(a.time) - parseTime(b.time));
    setTimetable(entries);

    // Save to history
    const today = new Date().toISOString().split("T")[0];
    const completedCount = tasks.filter((t) => t.completed).length;
    const rate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
    const newRecord: DayRecord = { date: today, timetable: entries, completionRate: rate };
    const updatedHistory = [...history.filter((h) => h.date !== today), newRecord];
    setHistory(updatedHistory);
    localStorage.setItem("student-history", JSON.stringify(updatedHistory));
  };

  return (
    <AppContext.Provider
      value={{
        profile, setProfile,
        tasks, setTasks, addTask, removeTask, toggleTask,
        timetable, setTimetable, generateTimetable,
        savedTimetables, setSavedTimetables, saveCurrentTimetable, loadTimetable, deleteSavedTimetable,
        history,
        syllabusFiles, addSyllabusFile, removeSyllabusFile,
        addModuleToSubject, removeModuleFromSubject, updateSyllabusFile,
        exams, addExam, removeExam,
        collegeTimetable, addCollegeSlot, removeCollegeSlot,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
