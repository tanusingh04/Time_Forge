import { GoogleGenAI, type Content } from "@google/genai";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export interface SyllabusContext {
  subjects: Array<{
    name: string;
    modules?: Array<{ name: string; estimatedHours?: number }>;
  }>;
}

export interface TaskContext {
  tasks: Array<{ title: string; subject: string; duration: number; priority?: string }>;
}

export interface ExamContext {
  title: string;
  subject: string;
  date: string;
  time?: string;
}

export interface CollegeSlotContext {
  day: number;
  startTime: string;
  endTime: string;
  subject: string;
  roomOrCode?: string;
}

export interface ProfileContext {
  name?: string;
  course?: string;
  semester?: string;
  institution?: string;
  studyHoursPerDay?: number;
  goals?: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIContext {
  syllabus: SyllabusContext;
  tasks: TaskContext;
  exams?: ExamContext[];
  collegeSlots?: CollegeSlotContext[];
  profile?: ProfileContext;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"] as const;
const MAX_HISTORY_MESSAGES = 20;

type QueryIntent =
  | "notes"
  | "explain"
  | "studyplan"
  | "quiz"
  | "examprep"
  | "schedule"
  | "general";

function detectIntent(message: string): QueryIntent {
  const lower = message.toLowerCase();
  if (/\b(quiz|test me|give.*question|mcq|practice q|flashcard)\b/.test(lower)) return "quiz";
  if (/\b(exam prep|prepare for exam|revise for|last minute|quick revise|before.*exam)\b/.test(lower)) return "examprep";
  if (/\b(study plan|make.*plan|plan.*week|plan.*day|schedule.*study|how.*study|allocate)\b/.test(lower)) return "studyplan";
  if (/\b(note|summary|summarize|overview|key point|topic|module|chapter|syllabus)\b/.test(lower)) return "notes";
  if (/\b(explain|what is|what are|how does|how do|why is|define|describe|understand|difference between)\b/.test(lower)) return "explain";
  if (/\b(when|which day|class|lecture|slot|timetable|college)\b/.test(lower)) return "schedule";
  return "general";
}

function getIntentInstructions(intent: QueryIntent): string {
  switch (intent) {
    case "notes":
      return (
        "Generate comprehensive, exam-ready notes. " +
        "Structure: ## Subject → ### Module → bullet-point key concepts → **bold** critical terms → formulas in code blocks → ### Quick Revision checklist at the end."
      );
    case "explain":
      return (
        "Explain clearly as an expert tutor. " +
        "Structure: 1-sentence TL;DR → analogy or intuition → step-by-step breakdown → key terms in **bold** → real-world example → common misconceptions."
      );
    case "quiz":
      return (
        "Generate 8-10 practice questions (mix of MCQ and short-answer). " +
        "Structure: Questions first (numbered), then ### Answers section with brief explanations. Focus on exam-likely topics."
      );
    case "examprep":
      return (
        "Prioritize ruthlessly. " +
        "Structure: ### Must-Know (high-frequency exam topics) → ### Key Formulas/Definitions → ### Likely Questions → ### 5-Minute Revision Checklist. Be concise — no filler."
      );
    case "studyplan":
      return (
        "Create a concrete, time-blocked study plan based on the student's available hours and upcoming exams. " +
        "Structure: Day-by-day table (Day | Subject | Topic | Duration) → prioritize subjects with nearest exams → include short breaks."
      );
    case "schedule":
      return (
        "Reference the student's college timetable directly. " +
        "Give specific day/time information. Suggest free slots for self-study if relevant."
      );
    default:
      return "Be concise, accurate, and helpful. Use bullet points for lists. Bold key terms.";
  }
}

function buildSystemPrompt(ctx: AIContext): string {
  const { syllabus, tasks, exams, collegeSlots, profile } = ctx;
  const today = new Date();
  const todayStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const todayISO = today.toISOString().split("T")[0];

  let prompt = `You are TimeForge AI — a sharp, expert academic tutor for college students. Today is ${todayStr}.

CORE RULES:
1. Provide REAL, accurate academic content. Never say "refer to your textbook" or give vague advice.
2. Use clean Markdown: ## headings, ### subheadings, **bold** for key terms, \`code\` for formulas/code, numbered lists for steps, bullets for concepts.
3. Be exam-oriented and precise. Front-load the most important information.
4. No unnecessary preamble — get straight to the content.
5. If the student's subject is in the curriculum below, draw from that context. For any topic not listed, answer accurately as a knowledgeable tutor.
6. Adapt tone to urgency: if an exam is <3 days away, be concise and focused on high-yield content only.

`;

  if (profile && (profile.name || profile.course || profile.semester)) {
    prompt += `STUDENT:\n`;
    if (profile.name) prompt += `- Name: ${profile.name}\n`;
    if (profile.course) prompt += `- Course: ${profile.course}\n`;
    if (profile.semester) prompt += `- Semester: ${profile.semester}\n`;
    if (profile.institution) prompt += `- Institution: ${profile.institution}\n`;
    if (profile.studyHoursPerDay) prompt += `- Study availability: ${profile.studyHoursPerDay}h/day\n`;
    if (profile.goals?.length) prompt += `- Goals: ${profile.goals.join("; ")}\n`;
    prompt += `\n`;
  }

  if (syllabus && syllabus.subjects && syllabus.subjects.length > 0) {
    prompt += `CURRICULUM (${syllabus.subjects.length} subject${syllabus.subjects.length > 1 ? "s" : ""}):\n`;
    syllabus.subjects.forEach((s) => {
      if (s.modules?.length) {
        prompt += `▸ ${s.name}: ${s.modules.map((m) => `${m.name}${m.estimatedHours ? ` (~${m.estimatedHours}h)` : ""}`).join(" | ")}\n`;
      } else {
        prompt += `▸ ${s.name}: (use standard curriculum topics)\n`;
      }
    });
    prompt += `\n`;
  }

  if (exams?.length) {
    const upcoming = exams
      .filter((e) => e.date >= todayISO)
      .map((e) => ({
        ...e,
        daysLeft: Math.max(0, Math.ceil((new Date(e.date).getTime() - today.getTime()) / 86400000)),
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft);

    if (upcoming.length) {
      prompt += `UPCOMING EXAMS:\n`;
      upcoming.forEach((e) => {
        const urgency = e.daysLeft === 0 ? " ⚠️ TODAY" : e.daysLeft <= 2 ? ` ⚠️ ${e.daysLeft}d away` : ` (${e.daysLeft}d)`;
        prompt += `- ${e.subject} — "${e.title}" on ${e.date}${e.time ? ` at ${e.time}` : ""}${urgency}\n`;
      });
      prompt += `When answering about these subjects, prioritize high-yield exam content.\n\n`;
    }
  }

  if (tasks && tasks.tasks && tasks.tasks.length > 0) {
    const highPriority = tasks.tasks.filter((t) => t.priority === "high");
    const shown = highPriority.length > 0 ? highPriority : tasks.tasks.slice(0, 8);
    prompt += `PENDING TASKS${highPriority.length > 0 ? " (high priority)" : ""}:\n`;
    shown.forEach((t) => {
      prompt += `- ${t.title} [${t.subject}, ${t.duration}min]\n`;
    });
    if (tasks.tasks.length > shown.length) {
      prompt += `  ...and ${tasks.tasks.length - shown.length} more.\n`;
    }
    prompt += `\n`;
  }

  if (collegeSlots?.length) {
    const byDay: Record<number, CollegeSlotContext[]> = {};
    collegeSlots.forEach((s) => {
      if (!byDay[s.day]) byDay[s.day] = [];
      byDay[s.day].push(s);
    });
    prompt += `WEEKLY COLLEGE SCHEDULE:\n`;
    Object.entries(byDay)
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([day, slots]) => {
        const slotStr = slots.map((s) => `${s.subject} ${s.startTime}-${s.endTime}${s.roomOrCode ? ` (${s.roomOrCode})` : ""}`).join(", ");
        prompt += `${DAY_NAMES[Number(day)]}: ${slotStr}\n`;
      });
    prompt += `\n`;
  }

  return prompt;
}

function toGeminiHistory(messages: ChatMessage[]): Content[] {
  return messages.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));
}

async function* yieldInChunks(text: string, chunkSize = 40): AsyncGenerator<string> {
  for (let i = 0; i < text.length; i += chunkSize) {
    yield text.slice(i, i + chunkSize);
    await new Promise((r) => setTimeout(r, 8));
  }
}

function buildFallbackResponse(userMessage: string, ctx: AIContext): string {
  const lower = userMessage.toLowerCase();
  const { syllabus } = ctx;
  const wantsContent = /note|summary|explain|revise|study|topic|module|help|quiz|plan/i.test(lower);

  if (!wantsContent) {
    return (
      `I can help with **notes**, **explanations**, **quizzes**, and **study plans** for your subjects.\n\n` +
      `Try:\n- "Notes for all my subjects"\n- "Explain [topic]"\n- "Quiz me on [subject]"\n- "Make a study plan for this week"\n\n` +
      (syllabus.subjects.length
        ? `Your subjects: ${syllabus.subjects.map((s) => s.name).join(", ")}`
        : "Add your syllabus first for personalized help.")
    );
  }

  if (!syllabus || syllabus.subjects.length === 0) {
    return `# Study Assistant\n\nAdd subjects in **Syllabus** first, then ask:\n- "Notes for Mathematics"\n- "Explain Module 1 from NLP"\n- "Quiz me on Deep Learning"\n\n*Add \`GEMINI_API_KEY\` to server \`.env\` for full AI-powered answers.*`;
  }

  const mentioned = syllabus.subjects.find((s) => lower.includes(s.name.toLowerCase()));
  const targets = mentioned ? [mentioned] : syllabus.subjects;

  const notes = targets
    .map((s) => {
      const moduleList = s.modules?.length
        ? s.modules.map((m) => `### ${m.name}\n- Key concepts for this module\n- Review definitions and core formulas\n- Practice example problems`).join("\n\n")
        : `### Overview\n- Review core definitions\n- Key formulas and theorems\n- Practice problems`;
      return `## ${s.name}\n\n${moduleList}`;
    })
    .join("\n\n---\n\n");

  return `${notes}\n\n---\n*Offline mode — add \`GEMINI_API_KEY\` to server \`.env\` for AI-generated notes tailored to your exact questions.*`;
}

export async function* generateAIResponseStream(
  userMessage: string,
  priorMessages: ChatMessage[],
  ctx: AIContext
): AsyncGenerator<string, void, unknown> {
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    yield* yieldInChunks(buildFallbackResponse(userMessage, ctx));
    return;
  }

  const intent = detectIntent(userMessage);
  const intentInstructions = getIntentInstructions(intent);
  const systemPrompt = buildSystemPrompt(ctx);

  const cappedHistory = priorMessages.slice(-MAX_HISTORY_MESSAGES);
  const history = toGeminiHistory(cappedHistory);

  const augmentedMessage = `${userMessage}\n\n[Format guidance: ${intentInstructions}]`;

  const temperature =
    intent === "quiz" || intent === "studyplan" ? 0.5
    : intent === "general" ? 0.3
    : 0.15;

  const ai = new GoogleGenAI({ apiKey });

  for (const model of MODELS) {
    try {
      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction: systemPrompt,
          temperature,
          maxOutputTokens: 8192,
        },
        history,
      });

      const stream = await chat.sendMessageStream({ message: augmentedMessage });

      let hasYielded = false;
      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          yield text;
          hasYielded = true;
        }
      }

      if (hasYielded) return;
    } catch (error) {
      logger.warn(`[TimeForge AI] Model ${model} failed: ${error}`);
    }
  }

  yield* yieldInChunks(buildFallbackResponse(userMessage, ctx));
}
