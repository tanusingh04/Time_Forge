package com.timeforge.controller;

import com.timeforge.dto.AiDtos.ChatRequest;
import com.timeforge.dto.ApiResponse;
import com.timeforge.model.*;
import com.timeforge.repository.*;
import com.timeforge.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final ExamRepository examRepository;
    private final SyllabusFileRepository syllabusFileRepository;

    public AiController(
            UserRepository userRepository,
            TaskRepository taskRepository,
            ExamRepository examRepository,
            SyllabusFileRepository syllabusFileRepository) {
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.examRepository = examRepository;
        this.syllabusFileRepository = syllabusFileRepository;
    }

    @PostMapping(value = "/chat", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<StreamingResponseBody> chatStream(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody ChatRequest req) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String message = req.getMessage() != null ? req.getMessage().trim() : "";
        String userId = principal.getId();

        List<Task> pendingTasks = taskRepository.findByUserId(userId).stream()
                .filter(t -> !Boolean.TRUE.equals(t.getCompleted()))
                .collect(Collectors.toList());
        List<Exam> exams = examRepository.findByUserIdOrderByDateAsc(userId);
        List<SyllabusFile> syllabi = syllabusFileRepository.findByUserIdOrderByUploadedAtDesc(userId);

        String responseText = generateAssistantResponse(message, pendingTasks, exams, syllabi);

        StreamingResponseBody stream = outputStream -> {
            byte[] bytes = responseText.getBytes(StandardCharsets.UTF_8);
            // Write in small chunks to simulate streaming for smooth frontend typing effect
            int chunkSize = 20;
            for (int i = 0; i < bytes.length; i += chunkSize) {
                int end = Math.min(bytes.length, i + chunkSize);
                outputStream.write(bytes, i, end - i);
                outputStream.flush();
                try {
                    Thread.sleep(15);
                } catch (InterruptedException ignored) {}
            }
        };

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .body(stream);
    }

    private String generateAssistantResponse(String message, List<Task> tasks, List<Exam> exams, List<SyllabusFile> syllabi) {
        String lower = message.toLowerCase();

        if (lower.contains("hello") || lower.contains("hi") || lower.contains("hey")) {
            StringBuilder sb = new StringBuilder("Hello! I am your **TimeForge Study Assistant**.\n\n");
            if (!exams.isEmpty()) {
                sb.append("⚠️ You have an upcoming exam: **").append(exams.get(0).getTitle())
                  .append("** on **").append(exams.get(0).getDate()).append("**.\n\n");
            }
            if (!tasks.isEmpty()) {
                sb.append("📋 You currently have **").append(tasks.size()).append(" pending task(s)**. Priority: `")
                  .append(tasks.get(0).getTitle()).append("`.\n\n");
            }
            sb.append("How can I help you today? You can ask me for study recommendations, revision plans, or quick explanations!");
            return sb.toString();
        }

        if (lower.contains("exam") || lower.contains("test")) {
            if (exams.isEmpty()) {
                return "You don't have any exams scheduled right now. You can add your upcoming exams in the **Exams** tab to get automated revision schedules!";
            }
            StringBuilder sb = new StringBuilder("### 📅 Upcoming Exams & Preparation:\n\n");
            for (Exam e : exams) {
                sb.append("- **").append(e.getTitle()).append("** (").append(e.getSubject()).append(") on `")
                  .append(e.getDate()).append("`\n");
            }
            sb.append("\n**Recommendation:** Allocate 45-minute daily focus sessions for the earliest exam.");
            return sb.toString();
        }

        if (lower.contains("task") || lower.contains("todo") || lower.contains("pending")) {
            if (tasks.isEmpty()) {
                return "🎉 Great job! You currently have zero pending tasks. Take a well-deserved break or plan ahead for tomorrow.";
            }
            StringBuilder sb = new StringBuilder("### 📝 Current Pending Tasks:\n\n");
            for (Task t : tasks) {
                sb.append("- [ ] **").append(t.getTitle()).append("** (").append(t.getSubject())
                  .append(") — ").append(t.getDuration()).append(" mins [").append(t.getPriority()).append("]\n");
            }
            sb.append("\n**Focus Strategy:** Start with high-priority tasks during your peak energy hours.");
            return sb.toString();
        }

        if (lower.contains("syllabus") || lower.contains("subject") || lower.contains("notes")) {
            if (syllabi.isEmpty()) {
                return "No syllabus uploaded yet. Head over to the **Syllabus** section to upload your course curriculum and break it down into manageable units!";
            }
            StringBuilder sb = new StringBuilder("### 📚 Your Enrolled Subjects:\n\n");
            for (SyllabusFile sf : syllabi) {
                sb.append("- **").append(sf.getName()).append("** (").append(sf.getSubject()).append("): ")
                  .append(sf.getModules().size()).append(" modules planned.\n");
            }
            return sb.toString();
        }

        return "### 💡 Study Guidance\n\n" +
               "Here is a recommended approach for your query:\n\n" +
               "1. **Break it down**: Divide large chapters into 25-minute Pomodoro intervals.\n" +
               "2. **Active Recall**: Test yourself after each section rather than passively re-reading.\n" +
               "3. **Spaced Repetition**: Revisit challenging topics at 1-day, 3-day, and 7-day intervals.\n\n" +
               "*Keep up the momentum in TimeForge!*";
    }
}
