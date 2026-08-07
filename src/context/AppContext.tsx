import React, { createContext, useContext, useState, useEffect } from "react";
import { saveFileToDB, getFileFromDB, deleteFileFromDB } from "@/lib/indexedDB";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
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
    const fetchInitialData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const [
          profileData,
          tasksData,
          timetablesData,
          historyData,
          syllabusData,
          examsData,
          collegeSlotsData
        ] = await Promise.all([
          api.get("/user/profile").catch(() => defaultProfile),
          api.get("/tasks").catch(() => []),
          api.get("/schedule/timetables").catch(() => []),
          api.get("/schedule/history").catch(() => []),
          api.get("/syllabus").catch(() => []),
          api.get("/exams").catch(() => []),
          api.get("/schedule/college-slots").catch(() => [])
        ]);

        if (profileData && profileData.email) setProfileState(profileData);
        if (tasksData) setTasksState(tasksData);
        if (timetablesData) setSavedTimetablesState(timetablesData);
        if (historyData) setHistory(historyData);
        if (syllabusData) setSyllabusFiles(syllabusData);
        if (examsData) setExamsState(examsData);
        if (collegeSlotsData) setCollegeTimetableState(collegeSlotsData);
      } catch (e) {
        console.error("Failed to fetch initial data", e);
      }
    };

    fetchInitialData();
  }, []);


  const setProfile = async (p: StudentProfile) => {
    setProfileState(p);
    try {
      await api.put("/user/profile", p);
    } catch (e) {
      console.error(e);
    }
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

  const saveCurrentTimetable = async (name?: string) => {
    if (timetable.length === 0) return;
    try {
      const saved = await api.post("/schedule/timetables", {
        name: name || `Timetable ${new Date().toLocaleDateString()}`,
        entries: timetable
      });
      setSavedTimetables([...savedTimetables, saved]);
    } catch (e) {
      console.error(e);
    }
  };

  const loadTimetable = (id: string) => {
    const saved = savedTimetables.find((t) => t.id === id);
    if (saved) {
      setTimetable(saved.entries);
    }
  };

  const deleteSavedTimetable = async (id: string) => {
    setSavedTimetables(savedTimetables.filter((t) => t.id !== id));
    try {
      await api.delete(`/schedule/timetables/${id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const addTask = async (t: Omit<Task, "id" | "completed">) => {
    try {
      const newTask = await api.post("/tasks", t);
      const updated = [...tasks, newTask];
      setTasks(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const removeTask = async (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    try {
      await api.delete(`/tasks/${id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTask = async (id: string) => {
    const taskToToggle = tasks.find((t) => t.id === id);
    if (!taskToToggle) return;
    
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    setTasks(updated);
    
    try {
      await api.put(`/tasks/${id}`, { completed: !taskToToggle.completed });
    } catch (e) {
      console.error(e);
    }
  };

  const addSyllabusFile = async (file: Pick<SyllabusFile, "name" | "subject" | "url">, blob?: Blob) => {
    if (blob) {
      try {
        const formData = new FormData();
        formData.append("file", blob, file.name);
        formData.append("name", file.name);
        if (file.subject) formData.append("subject", file.subject);
        
        const newFile = await api.upload("/syllabus/upload", formData);
        setSyllabusFiles([...syllabusFiles, newFile]);
      } catch (e) {
        console.error("Failed to upload syllabus file", e);
      }
    }
  };

  const removeSyllabusFile = async (index: number) => {
    const fileToRemove = syllabusFiles[index];
    const updated = syllabusFiles.filter((_, i) => i !== index);
    setSyllabusFiles(updated);
    
    if (fileToRemove?.id) {
      try {
        await api.delete(`/syllabus/${fileToRemove.id}`);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const addModuleToSubject = async (subjectIndex: number, module: Omit<SubjectModule, "id">) => {
    const file = syllabusFiles[subjectIndex];
    if (!file || !file.id) return;
    
    try {
      const newModule = await api.post(`/syllabus/${file.id}/modules`, module);
      const updated = [...syllabusFiles];
      if (!updated[subjectIndex].modules) updated[subjectIndex].modules = [];
      updated[subjectIndex].modules!.push(newModule);
      setSyllabusFiles(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const removeModuleFromSubject = async (subjectIndex: number, moduleId: string) => {
    const file = syllabusFiles[subjectIndex];
    if (!file || !file.id) return;
    
    const updated = [...syllabusFiles];
    if (updated[subjectIndex].modules) {
      updated[subjectIndex].modules = updated[subjectIndex].modules!.filter((m) => m.id !== moduleId);
      setSyllabusFiles(updated);
    }
    
    try {
      await api.delete(`/syllabus/${file.id}/modules/${moduleId}`);
    } catch (e) {
      console.error(e);
    }
  };

  const updateSyllabusFile = (index: number, updates: Partial<SyllabusFile>) => {
    const updated = [...syllabusFiles];
    updated[index] = { ...updated[index], ...updates };
    setSyllabusFiles(updated);
    localStorage.setItem("student-syllabus", JSON.stringify(updated));
  };

  const addExam = async (exam: Omit<Exam, "id">) => {
    try {
      const newExam = await api.post("/exams", exam);
      const updated = [...exams, newExam].sort((a, b) => a.date.localeCompare(b.date));
      setExamsState(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const removeExam = async (id: string) => {
    const updated = exams.filter((e) => e.id !== id);
    setExamsState(updated);
    try {
      await api.delete(`/exams/${id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const addCollegeSlot = async (slot: Omit<CollegeSlot, "id">) => {
    try {
      const newSlot = await api.post("/schedule/college-slots", slot);
      const updated = [...collegeTimetable, newSlot];
      setCollegeTimetableState(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const removeCollegeSlot = async (id: string) => {
    const updated = collegeTimetable.filter((s) => s.id !== id);
    setCollegeTimetableState(updated);
    try {
      await api.delete(`/schedule/college-slots/${id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const generateTimetable = async () => {
    try {
      toast({ title: "Generating timetable...", description: "Please wait while we create an optimal schedule." });
      const data = await api.post("/schedule/generate");
      if (data.timetable) {
        setTimetable(data.timetable);
      }
      if (data.dayRecord) {
        setHistory((prevHistory) => {
          const updatedHistory = [...prevHistory.filter((h) => h.date !== data.dayRecord.date), data.dayRecord];
          return updatedHistory;
        });
      }
      toast({ title: "Success!", description: "New timetable generated." });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Generation failed", description: e.message || "Failed to generate timetable.", variant: "destructive" });
    }
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
