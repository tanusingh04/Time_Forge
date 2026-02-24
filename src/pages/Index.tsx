import { motion } from "framer-motion";
import { useAppState } from "@/context/AppContext";
import { Calendar, CheckCircle2, Clock, Target, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";

const Dashboard = () => {
  const { profile, tasks, timetable, history } = useAppState();

  const completedToday = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedToday / totalTasks) * 100) : 0;
  const currentHour = new Date().getHours();

  const greeting =
    currentHour < 12 ? "Good Morning" : currentHour < 17 ? "Good Afternoon" : "Good Evening";

  const upcomingEntries = timetable.slice(0, 4);

  const stats = [
    { icon: CheckCircle2, label: "Tasks Done", value: `${completedToday}/${totalTasks}`, color: "text-primary" },
    { icon: Target, label: "Completion", value: `${completionRate}%`, color: "text-accent" },
    { icon: Calendar, label: "Schedule Items", value: timetable.length.toString(), color: "text-primary" },
    { icon: Clock, label: "Days Tracked", value: history.length.toString(), color: "text-accent" },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary rounded-2xl p-8 text-primary-foreground shadow-glow-purple"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={20} />
            <span className="text-sm font-medium opacity-80">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-1">
            {greeting}, {profile.name || "Student"} 👋
          </h1>
          <p className="opacity-80 text-sm">
            {totalTasks === 0
              ? "Start by adding tasks to build your perfect day!"
              : `You have ${totalTasks - completedToday} tasks remaining today. Keep going!`}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl p-5 border border-border shadow-sm"
            >
              <stat.icon className={`${stat.color} mb-2`} size={22} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions + Upcoming Schedule */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl p-6 border border-border"
          >
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/tasks" className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Add New Task</p>
                  <p className="text-xs text-muted-foreground">Plan your study sessions</p>
                </div>
              </Link>
              <Link to="/timetable" className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Calendar size={16} className="text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Generate Timetable</p>
                  <p className="text-xs text-muted-foreground">AI-powered schedule</p>
                </div>
              </Link>
              <Link to="/profile" className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Target size={16} className="text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Set Your Goals</p>
                  <p className="text-xs text-muted-foreground">Define what matters</p>
                </div>
              </Link>
            </div>
          </motion.div>

          {/* Today's Schedule Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl p-6 border border-border"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Today's Schedule</h2>
              <Link to="/timetable" className="text-xs text-primary hover:underline">View all →</Link>
            </div>
            {upcomingEntries.length > 0 ? (
              <div className="space-y-3">
                {upcomingEntries.map((entry) => {
                  const typeColors: Record<string, string> = {
                    study: "bg-primary/10 text-primary border-primary/20",
                    break: "bg-accent/10 text-accent border-accent/20",
                    meal: "bg-beige-warm border-border",
                    exercise: "bg-secondary text-secondary-foreground border-border",
                    personal: "bg-purple-soft text-foreground border-border",
                  };
                  return (
                    <div key={entry.id} className={`p-3 rounded-lg border ${typeColors[entry.type] || "bg-card"}`}>
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">{entry.task}</p>
                        <span className="text-xs text-muted-foreground">{entry.time} - {entry.endTime}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{entry.subject}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No schedule yet</p>
                <p className="text-xs">Add tasks and generate your timetable</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* User Goals Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-xl p-6 border border-border"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} className="text-primary" />
            <h2 className="text-xl font-bold">Your Goals</h2>
          </div>

          {profile.goals && profile.goals.length > 0 ? (
            <ul className="grid sm:grid-cols-2 gap-4">
              {profile.goals.map((goal, index) => (
                <li key={index} className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50 border border-border/50">
                  <div className="mt-0.5 min-w-5 h-5 flex items-center justify-center rounded-full bg-primary/20 text-primary">
                    <span className="text-xs font-bold">{index + 1}</span>
                  </div>
                  <span className="text-sm font-medium leading-relaxed">{goal}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 bg-secondary/40 rounded-xl border border-dashed border-border">
              <p className="text-muted-foreground mb-3">You haven't set any goals yet.</p>
              <Link to="/profile">
                <button className="text-sm font-medium text-primary hover:underline flex items-center justify-center gap-1 mx-auto">
                  Set your goals <Target size={14} />
                </button>
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Dashboard;
