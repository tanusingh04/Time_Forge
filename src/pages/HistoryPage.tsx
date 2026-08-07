import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAppState } from "@/context/AppContext";
import Layout from "@/components/Layout";
import {
  History,
  TrendingUp,
  CalendarDays,
  Target,
  Award,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  BookOpen,
  Coffee,
  Heart,
  User,
} from "lucide-react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

const getTypeIcon = (type: string) => {
  switch (type) {
    case "study":
      return <BookOpen size={14} />;
    case "break":
      return <Coffee size={14} />;
    case "meal":
      return <Coffee size={14} />;
    case "exercise":
      return <Heart size={14} />;
    case "personal":
      return <User size={14} />;
    default:
      return <Clock size={14} />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "study":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "break":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "meal":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    case "exercise":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    case "personal":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

const HistoryPage = () => {
  const { history } = useAppState();
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Calculate summary statistics
  const stats = useMemo(() => {
    if (history.length === 0) return null;

    const totalDays = history.length;
    const avgCompletion = Math.round(
      history.reduce((sum, record) => sum + record.completionRate, 0) / totalDays
    );
    const bestDay = [...history].sort((a, b) => b.completionRate - a.completionRate)[0];

    // Format data for the chart
    const chartData = [...history]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14) // Only show last 14 entries on chart
      .map((record) => ({
        date: format(parseISO(record.date), "MMM d"),
        rate: record.completionRate,
        fullDate: record.date,
      }));

    return { totalDays, avgCompletion, bestDay, chartData };
  }, [history]);

  const toggleDate = (date: string) => {
    const next = new Set(expandedDates);
    if (next.has(date)) {
      next.delete(date);
    } else {
      next.add(date);
    }
    setExpandedDates(next);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">History & Analytics</h1>
          <p className="text-muted-foreground mt-1">Review your past performance and study trends</p>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border mt-10 shadow-sm">
            <History size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No history yet</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Complete tasks and generate your first daily timetable to start building your study history and analytics.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Quick Stats Row */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <CalendarDays size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Days Tracked</p>
                    <p className="text-2xl font-bold">{stats.totalDays}</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                    <Target size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Completion</p>
                    <p className="text-2xl font-bold">{stats.avgCompletion}%</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                    <Award size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground truncate">Best Performance</p>
                    <div className="flex items-baseline gap-2 truncate">
                      <p className="text-2xl font-bold shrink-0">{stats.bestDay.completionRate}%</p>
                      <p className="text-xs text-muted-foreground truncate">
                        ({format(parseISO(stats.bestDay.date), "MMM d")})
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Performance Chart */}
            {stats && stats.chartData.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card p-6 rounded-2xl border border-border shadow-sm"
              >
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp size={20} className="text-primary" />
                  <h2 className="text-lg font-bold">14-Day Performance Trend</h2>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "currentColor", opacity: 0.7 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "currentColor", opacity: 0.7 }}
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                          backgroundColor: "hsl(var(--card))",
                          color: "hsl(var(--foreground))",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
                        }}
                        itemStyle={{ color: "hsl(var(--primary))", fontWeight: "bold" }}
                        formatter={(value: number) => [`${value}%`, "Completion"]}
                        labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--background))", stroke: "hsl(var(--primary))" }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--primary))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* Detailed History List */}
            <div className="space-y-4 pt-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CalendarDays size={20} className="opacity-70" />
                Daily Records
              </h2>
              <div className="space-y-4">
                {[...history].reverse().map((record, i) => (
                  <motion.div
                    key={record.date}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="p-5">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${record.completionRate >= 80
                                ? "bg-green-500/10 text-green-500"
                                : record.completionRate >= 50
                                  ? "bg-amber-500/10 text-amber-500"
                                  : "bg-red-500/10 text-red-500"
                              }`}
                          >
                            <CheckCircle2 size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">
                              {format(parseISO(record.date), "EEEE, MMMM do")}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <CalendarDays size={14} />
                              {record.timetable.length} Scheduled Blocks
                            </p>
                          </div>
                        </div>
                        <div className="sm:text-right flex sm:block items-center justify-between">
                          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1 sm:hidden">
                            Completed
                          </p>
                          <div>
                            <p className="text-3xl font-bold tracking-tight">
                              {record.completionRate}<span className="text-sm text-muted-foreground">%</span>
                            </p>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:block">
                              completed
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden mb-4">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${record.completionRate}%` }}
                          transition={{ duration: 1, delay: 0.5 + i * 0.05, ease: "easeOut" }}
                          className={`h-full rounded-full ${record.completionRate >= 80
                              ? "bg-green-500"
                              : record.completionRate >= 50
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                        />
                      </div>

                      <div className="flex justify-between items-center bg-secondary/50 -mx-5 -mb-5 px-5 py-3">
                        <div className="text-xs text-muted-foreground font-medium">
                          {format(parseISO(record.date), "yyyy-MM-dd")}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDate(record.date)}
                          className="text-muted-foreground hover:text-foreground h-8"
                        >
                          {expandedDates.has(record.date) ? "Hide Details" : "View Breakdown"}
                          {expandedDates.has(record.date) ? (
                            <ChevronUp size={16} className="ml-1.5" />
                          ) : (
                            <ChevronDown size={16} className="ml-1.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Collapsible open={expandedDates.has(record.date)}>
                      <CollapsibleContent>
                        <div className="bg-secondary/20 p-5 border-t border-border">
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Clock size={16} className="text-primary" />
                            Schedule Play-by-Play
                          </h4>
                          <div className="space-y-2">
                            {record.timetable.map((entry, idx) => (
                              <div
                                key={entry.id || idx}
                                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50 text-sm shadow-sm hover:border-primary/30 transition-colors"
                              >
                                <div className="text-muted-foreground font-mono shrink-0 w-[4.5rem] text-center bg-secondary/80 px-2 py-1.5 rounded-md text-xs font-medium">
                                  {entry.time}
                                </div>
                                <div
                                  className={`p-2 rounded-lg shrink-0 ${getTypeColor(entry.type)}`}
                                >
                                  {getTypeIcon(entry.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-foreground truncate">{entry.task}</p>
                                  <p className="text-xs text-muted-foreground truncate opacity-80 mt-0.5">{entry.subject}</p>
                                </div>
                                <div className="text-muted-foreground font-mono shrink-0 text-xs opacity-60">
                                  {entry.endTime}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HistoryPage;
