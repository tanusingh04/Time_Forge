import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";

// Lazy load all pages to drastically reduce the initial bundle size
const Index = React.lazy(() => import("./pages/Index"));
const TasksPage = React.lazy(() => import("./pages/Tasks"));
const TimetablePage = React.lazy(() => import("./pages/Timetable"));
const HistoryPage = React.lazy(() => import("./pages/HistoryPage"));
const SyllabusPage = React.lazy(() => import("./pages/Syllabus"));
const ExamsPage = React.lazy(() => import("./pages/Exams"));
const CollegeTimetablePage = React.lazy(() => import("./pages/CollegeTimetable"));
const ChatPage = React.lazy(() => import("./pages/Chat"));
const ProfilePage = React.lazy(() => import("./pages/Profile"));
const SettingsPage = React.lazy(() => import("./pages/Settings"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// A simple loading fallback for suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/timetable" element={<TimetablePage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/syllabus" element={<SyllabusPage />} />
                <Route path="/exams" element={<ExamsPage />} />
                <Route path="/college-timetable" element={<CollegeTimetablePage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
