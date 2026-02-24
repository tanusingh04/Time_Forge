import { GoogleGenAI } from "@google/genai";

/**
 * AI Service for Study Assistant
 * 
 * This service handles AI chat interactions using the Google Gemini API.
 */

interface SyllabusContext {
  subjects: Array<{
    name: string;
    modules?: Array<{
      name: string;
      estimatedHours?: number;
    }>;
  }>;
}

interface TaskContext {
  tasks: Array<{
    title: string;
    subject: string;
    duration: number;
  }>;
}

export const generateAIResponse = async (
  userMessage: string,
  syllabusContext: SyllabusContext,
  taskContext: TaskContext
): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return "Error: Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file.";
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemPrompt = buildSystemPrompt(syllabusContext, taskContext);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    return response.text || "I'm sorry, I couldn't generate a response at this time.";
  } catch (error) {
    console.error("AI Error:", error);
    return "I encountered an error while trying to process your request. Please try again later.";
  }
};

const buildSystemPrompt = (
  syllabusContext: SyllabusContext,
  taskContext: TaskContext
): string => {
  let prompt = `You are a helpful and intelligent AI study assistant for a student. Your role is to help with:
- Creating detailed, accurate study notes and summaries for subjects based on the student's requests.
- Explaining concepts and topics clearly, using analogies when appropriate.
- Providing study tips, strategies, and answering academic questions.
- Structuring your answers with markdown (headings, bullet points, bold text) to make them readable.

`;

  if (syllabusContext.subjects.length > 0) {
    prompt += `The student has uploaded syllabus files for the following subjects:\n`;
    syllabusContext.subjects.forEach((subject) => {
      prompt += `\n**${subject.name}**\n`;
      if (subject.modules && subject.modules.length > 0) {
        subject.modules.forEach((module) => {
          const hours = module.estimatedHours ? ` (~${module.estimatedHours} hours)` : "";
          prompt += `- ${module.name}${hours}\n`;
        });
      }
    });
    prompt += `\nWhen the student asks about notes or topics, reference these subjects and modules in your explanations.\n\n`;
  }

  if (taskContext.tasks.length > 0) {
    prompt += `The student's current pending study tasks:\n`;
    taskContext.tasks.forEach((task) => {
      prompt += `- ${task.title} (${task.subject}, ${task.duration} min)\n`;
    });
    prompt += `\nYou might use this context to gently encourage them or contextualize their study questions.\n`;
  }

  prompt += `Always be concise, accurate, and focus on practical study advice. Format your output using Markdown.`;

  return prompt;
};
