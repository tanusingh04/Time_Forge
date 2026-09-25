import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
const defaultProfile = {
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
const AppContext = createContext(null);
export const useAppState = () => {
    const ctx = useContext(AppContext);
    if (!ctx)
        throw new Error("useAppState must be used within AppProvider");
    return ctx;
};
const loadFromStorage = (key, fallback) => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : fallback;
    }
    catch {
        return fallback;
    }
};
export const AppProvider = ({ children }) => {
    const { toast } = useToast();
    const [profile, setProfileState] = useState(() => loadFromStorage("student-profile", defaultProfile));
    const [tasks, setTasksState] = useState(() => loadFromStorage("student-tasks", []));
    const [timetable, setTimetableState] = useState(() => loadFromStorage("student-timetable", []));
    const [savedTimetables, setSavedTimetablesState] = useState(() => loadFromStorage("student-saved-timetables", []));
    const [regenerationCount, setRegenerationCount] = useState(() => loadFromStorage("regeneration-count", 0));
    const [history, setHistory] = useState(() => loadFromStorage("student-history", []));
    const [syllabusFiles, setSyllabusFiles] = useState(() => loadFromStorage("student-syllabus", []));
    const [exams, setExamsState] = useState(() => loadFromStorage("student-exams", []));
    const [collegeTimetable, setCollegeTimetableState] = useState(() => loadFromStorage("student-college-timetable", []));
    useEffect(() => {
        const fetchInitialData = async () => {
            const token = localStorage.getItem("token");
            if (!token)
                return;
            try {
                const [profileData, tasksData, timetablesData, historyData, syllabusData, examsData, collegeSlotsData] = await Promise.all([
                    api.get("/users/profile").catch(() => defaultProfile),
                    api.get("/tasks").catch(() => []),
                    api.get("/schedule/saved").catch(() => []),
                    api.get("/schedule/history").catch(() => []),
                    api.get("/syllabus").catch(() => []),
                    api.get("/exams").catch(() => []),
                    api.get("/schedule/college").catch(() => [])
                ]);
                if (profileData && profileData.email)
                    setProfileState(profileData);
                if (tasksData)
                    setTasksState(tasksData);
                if (timetablesData)
                    setSavedTimetablesState(timetablesData);
                if (historyData)
                    setHistory(historyData);
                if (syllabusData)
                    setSyllabusFiles(syllabusData);
                if (examsData)
                    setExamsState(examsData);
                if (collegeSlotsData)
                    setCollegeTimetableState(collegeSlotsData);
            }
            catch (e) {
                console.error("Failed to fetch initial data", e);
            }
        };
        fetchInitialData();
    }, []);
    const setProfile = async (p) => {
        setProfileState(p);
        try {
            await api.put("/users/profile", p);
        }
        catch (e) {
            console.error(e);
        }
    };
    const setTasks = (t) => {
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
            if (!todayRecord)
                return prevHistory; // No history for today yet, nothing to update
            const updatedRecord = { ...todayRecord, completionRate: rate };
            const updatedHistory = [...prevHistory.filter((h) => h.date !== today), updatedRecord];
            localStorage.setItem("student-history", JSON.stringify(updatedHistory));
            return updatedHistory;
        });
    };
    const setTimetable = (t) => {
        setTimetableState(t);
        localStorage.setItem("student-timetable", JSON.stringify(t));
    };
    const setSavedTimetables = (t) => {
        setSavedTimetablesState(t);
        localStorage.setItem("student-saved-timetables", JSON.stringify(t));
    };
    const saveCurrentTimetable = async (name) => {
        if (timetable.length === 0)
            return;
        try {
            const saved = await api.post("/schedule/saved", {
                name: name || `Timetable ${new Date().toLocaleDateString()}`,
                entries: timetable
            });
            setSavedTimetables([...savedTimetables, saved]);
        }
        catch (e) {
            console.error(e);
        }
    };
    const loadTimetable = (id) => {
        const saved = savedTimetables.find((t) => t.id === id);
        if (saved) {
            setTimetable(saved.entries);
        }
    };
    const deleteSavedTimetable = async (id) => {
        setSavedTimetables(savedTimetables.filter((t) => t.id !== id));
        try {
            await api.delete(`/schedule/saved/${id}`);
        }
        catch (e) {
            console.error(e);
        }
    };
    const addTask = async (t) => {
        try {
            const newTask = await api.post("/tasks", t);
            const updated = [...tasks, newTask];
            setTasks(updated);
        }
        catch (e) {
            console.error(e);
        }
    };
    const removeTask = async (id) => {
        const updated = tasks.filter((t) => t.id !== id);
        setTasks(updated);
        try {
            await api.delete(`/tasks/${id}`);
        }
        catch (e) {
            console.error(e);
        }
    };
    const toggleTask = async (id) => {
        const taskToToggle = tasks.find((t) => t.id === id);
        if (!taskToToggle)
            return;
        const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
        setTasks(updated);
        try {
            await api.put(`/tasks/${id}`, { completed: !taskToToggle.completed });
        }
        catch (e) {
            console.error(e);
        }
    };
    const addSyllabusFile = async (file, blob) => {
        if (blob) {
            try {
                const formData = new FormData();
                formData.append("file", blob, file.name);
                formData.append("name", file.name);
                if (file.subject)
                    formData.append("subject", file.subject);
                const newFile = await api.upload("/syllabus/upload", formData);
                setSyllabusFiles([...syllabusFiles, newFile]);
            }
            catch (e) {
                console.error("Failed to upload syllabus file", e);
            }
        }
    };
    const removeSyllabusFile = async (index) => {
        const fileToRemove = syllabusFiles[index];
        const updated = syllabusFiles.filter((_, i) => i !== index);
        setSyllabusFiles(updated);
        if (fileToRemove?.id) {
            try {
                await api.delete(`/syllabus/${fileToRemove.id}`);
            }
            catch (e) {
                console.error(e);
            }
        }
    };
    const addModuleToSubject = async (subjectIndex, module) => {
        const file = syllabusFiles[subjectIndex];
        if (!file || !file.id)
            return;
        try {
            const newModule = await api.post(`/syllabus/${file.id}/modules`, module);
            const updated = [...syllabusFiles];
            if (!updated[subjectIndex].modules)
                updated[subjectIndex].modules = [];
            updated[subjectIndex].modules.push(newModule);
            setSyllabusFiles(updated);
        }
        catch (e) {
            console.error(e);
        }
    };
    const removeModuleFromSubject = async (subjectIndex, moduleId) => {
        const file = syllabusFiles[subjectIndex];
        if (!file || !file.id)
            return;
        const updated = [...syllabusFiles];
        if (updated[subjectIndex].modules) {
            updated[subjectIndex].modules = updated[subjectIndex].modules.filter((m) => m.id !== moduleId);
            setSyllabusFiles(updated);
        }
        try {
            await api.delete(`/syllabus/${file.id}/modules/${moduleId}`);
        }
        catch (e) {
            console.error(e);
        }
    };
    const updateSyllabusFile = (index, updates) => {
        const updated = [...syllabusFiles];
        updated[index] = { ...updated[index], ...updates };
        setSyllabusFiles(updated);
        localStorage.setItem("student-syllabus", JSON.stringify(updated));
    };
    const addExam = async (exam) => {
        try {
            const newExam = await api.post("/exams", exam);
            const updated = [...exams, newExam].sort((a, b) => a.date.localeCompare(b.date));
            setExamsState(updated);
        }
        catch (e) {
            console.error(e);
        }
    };
    const removeExam = async (id) => {
        const updated = exams.filter((e) => e.id !== id);
        setExamsState(updated);
        try {
            await api.delete(`/exams/${id}`);
        }
        catch (e) {
            console.error(e);
        }
    };
    const addCollegeSlot = async (slot) => {
        try {
            const newSlot = await api.post("/schedule/college", slot);
            const updated = [...collegeTimetable, newSlot];
            setCollegeTimetableState(updated);
        }
        catch (e) {
            console.error(e);
        }
    };
    const removeCollegeSlot = async (id) => {
        const updated = collegeTimetable.filter((s) => s.id !== id);
        setCollegeTimetableState(updated);
        try {
            await api.delete(`/schedule/college/${id}`);
        }
        catch (e) {
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
        }
        catch (e) {
            console.error(e);
            toast({ title: "Generation failed", description: e.message || "Failed to generate timetable.", variant: "destructive" });
        }
    };
    return (<AppContext.Provider value={{
            profile, setProfile,
            tasks, setTasks, addTask, removeTask, toggleTask,
            timetable, setTimetable, generateTimetable,
            savedTimetables, setSavedTimetables, saveCurrentTimetable, loadTimetable, deleteSavedTimetable,
            history,
            syllabusFiles, addSyllabusFile, removeSyllabusFile,
            addModuleToSubject, removeModuleFromSubject, updateSyllabusFile,
            exams, addExam, removeExam,
            collegeTimetable, addCollegeSlot, removeCollegeSlot,
        }}>
      {children}
    </AppContext.Provider>);
};
