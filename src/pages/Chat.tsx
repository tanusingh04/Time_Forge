import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppState } from "@/context/AppContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, User, BookOpen, Sparkles, Loader2, Square, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { generateAIResponseStream, type ChatMessage as AIChatMessage } from "@/services/aiService";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  intent?: string;
}

const ChatPage = () => {
  const { syllabusFiles, tasks, exams, collegeTimetable, profile } = useAppState();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const stopGeneration = () => {
    abortRef.current = true;
    setIsLoading(false);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    const priorForAI: AIChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const assistantId = crypto.randomUUID();
    const assistantPlaceholder: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setInput("");
    setIsLoading(true);
    abortRef.current = false;

    try {
      const stream = generateAIResponseStream(trimmed, priorForAI);
      let full = "";

      for await (const chunk of stream) {
        if (abortRef.current) break;
        full += chunk;
        const snapshot = full;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: snapshot } : m))
        );
      }

      if (!full.trim()) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "I couldn't generate a response. Please try again." }
              : m
          )
        );
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => sendMessage(input);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Dynamic suggested questions based on actual user data
  const suggestedQuestions = (() => {
    const questions: string[] = [];
    const subjects = syllabusFiles.filter((s) => s.subject).map((s) => s.subject!);
    const upcomingExams = exams.filter((e) => e.date >= new Date().toISOString().split("T")[0]);
    const pendingTasks = tasks.filter((t) => !t.completed);

    if (upcomingExams.length > 0) {
      const nearest = upcomingExams.sort((a, b) => a.date.localeCompare(b.date))[0];
      questions.push(`Exam prep: what are the most important topics for ${nearest.subject}?`);
    }

    if (subjects.length > 0) {
      questions.push(`Give me detailed notes for ${subjects[0]}`);
      if (subjects.length > 1) {
        questions.push(`Quiz me on ${subjects[Math.floor(subjects.length / 2)]}`);
      }
    } else {
      questions.push("Give me notes for all my subjects");
      questions.push("Explain a key concept from my syllabus");
    }

    if (pendingTasks.length > 0) {
      questions.push("Make a study plan to clear my pending tasks this week");
    } else {
      questions.push("Create an efficient study plan for this week");
    }

    if (questions.length < 4) {
      questions.push("What should I revise before my next exam?");
    }

    return questions.slice(0, 4);
  })();

  const hasApiKey = true;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Bot size={24} className="text-primary" />
            <h1 className="text-2xl font-bold">AI Study Assistant</h1>
            {hasApiKey && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <Zap size={10} className="fill-current" />
                Gemini 2.5 Flash
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Get notes, explanations, quizzes, and study plans — powered by your syllabus, tasks, and exams
          </p>

        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Sparkles size={32} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {profile.name ? `Ready to help, ${profile.name}!` : "Welcome to your AI Study Assistant!"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Ask for notes, explanations, quizzes, or study plans — I know your syllabus, tasks, and exams.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto">
                {suggestedQuestions.map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="text-left justify-start h-auto py-3 px-4"
                    disabled={isLoading}
                    onClick={() => sendMessage(q)}
                  >
                    <BookOpen size={16} className="mr-2 shrink-0" />
                    <span className="text-sm">{q}</span>
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot size={18} className="text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border"
                  }`}
                >
                  <div className="text-sm">
                    {message.role === "assistant" ? (
                      message.content ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 size={14} className="animate-spin" />
                          <span>Thinking...</span>
                        </div>
                      )
                    ) : (
                      <div className="whitespace-pre-wrap break-words">{message.content}</div>
                    )}
                  </div>
                  {message.content && (
                    <div
                      className={`text-xs mt-2 ${
                        message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User size={18} className="text-secondary-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border pt-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask for notes, explanations, a quiz, or a study plan..."
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={isLoading}
            />
            {isLoading ? (
              <Button
                onClick={stopGeneration}
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground shrink-0 h-[60px]"
                title="Stop generating"
              >
                <Square size={18} className="fill-current" />
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                disabled={!input.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 h-[60px]"
              >
                <Send size={20} />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Enter to send · Shift+Enter for new line · Detects intent (notes / quiz / study plan / explain)
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;
