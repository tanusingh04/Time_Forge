package com.timeforge.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.timeforge.dto.ApiResponse;
import com.timeforge.dto.ScheduleDtos.*;
import com.timeforge.model.*;
import com.timeforge.repository.*;
import com.timeforge.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/schedule")
public class ScheduleController {

    private final CollegeSlotRepository collegeSlotRepository;
    private final SavedTimetableRepository savedTimetableRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final SyllabusFileRepository syllabusFileRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ScheduleController(
            CollegeSlotRepository collegeSlotRepository,
            SavedTimetableRepository savedTimetableRepository,
            UserRepository userRepository,
            TaskRepository taskRepository,
            SyllabusFileRepository syllabusFileRepository) {
        this.collegeSlotRepository = collegeSlotRepository;
        this.savedTimetableRepository = savedTimetableRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.syllabusFileRepository = syllabusFileRepository;
    }

    // ─── College Slots ──────────────────────────────────────────────────────────

    @GetMapping("/slots")
    public ResponseEntity<ApiResponse<?>> getCollegeSlots(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        List<CollegeSlot> slots = collegeSlotRepository.findByUserId(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(slots));
    }

    @PostMapping("/slots")
    public ResponseEntity<ApiResponse<?>> addCollegeSlot(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CollegeSlotRequest req) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));

        CollegeSlot slot = new CollegeSlot();
        slot.setDay(req.getDay());
        slot.setStartTime(req.getStartTime());
        slot.setEndTime(req.getEndTime());
        slot.setSubject(req.getSubject());
        slot.setRoomOrCode(req.getRoomOrCode());
        slot.setUserId(principal.getId());

        slot = collegeSlotRepository.save(slot);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(slot));
    }

    @DeleteMapping("/slots/{id}")
    public ResponseEntity<ApiResponse<?>> removeCollegeSlot(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));

        CollegeSlot slot = collegeSlotRepository.findByIdAndUserId(id, principal.getId()).orElse(null);
        if (slot == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("College slot not found or unauthorized"));
        }

        collegeSlotRepository.delete(slot);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("id", id)));
    }

    // ─── Saved Timetables ───────────────────────────────────────────────────────

    @GetMapping("/saved")
    public ResponseEntity<ApiResponse<?>> getSavedTimetables(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));

        List<SavedTimetable> saved = savedTimetableRepository.findByUserIdOrderByCreatedAtDesc(principal.getId());
        List<Map<String, Object>> response = saved.stream().map(s -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("name", s.getName());
            map.put("createdAt", s.getCreatedAt());
            map.put("userId", s.getUserId());
            try {
                map.put("entries", objectMapper.readValue(s.getEntries(), Object.class));
            } catch (Exception e) {
                map.put("entries", Collections.emptyList());
            }
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/save")
    public ResponseEntity<ApiResponse<?>> saveTimetable(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SaveTimetableRequest req) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));

        SavedTimetable timetable = new SavedTimetable();
        timetable.setName(req.getName());
        timetable.setUserId(principal.getId());
        try {
            timetable.setEntries(objectMapper.writeValueAsString(req.getEntries()));
        } catch (Exception e) {
            timetable.setEntries("[]");
        }

        timetable = savedTimetableRepository.save(timetable);

        Map<String, Object> result = new HashMap<>();
        result.put("id", timetable.getId());
        result.put("name", timetable.getName());
        result.put("createdAt", timetable.getCreatedAt());
        result.put("entries", req.getEntries());

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result));
    }

    @DeleteMapping("/saved/{id}")
    public ResponseEntity<ApiResponse<?>> deleteSavedTimetable(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));

        SavedTimetable item = savedTimetableRepository.findByIdAndUserId(id, principal.getId()).orElse(null);
        if (item == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Saved timetable not found or unauthorized"));
        }

        savedTimetableRepository.delete(item);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("id", id)));
    }

    // ─── Timetable Generator ────────────────────────────────────────────────────

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<?>> generateTimetable(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));

        User user = userRepository.findById(principal.getId()).orElse(null);
        if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("User not found"));

        List<CollegeSlot> collegeSlots = collegeSlotRepository.findByUserId(principal.getId());
        List<Task> tasks = taskRepository.findByUserId(principal.getId());
        List<SyllabusFile> syllabusList = syllabusFileRepository.findByUserId(principal.getId());

        int wakeUp = parseTime(user.getWakeUpTime() != null ? user.getWakeUpTime() : "06:00");
        int sleep = parseTime(user.getSleepTime() != null ? user.getSleepTime() : "22:00");

        List<TimetableEntry> entries = new ArrayList<>();
        int currentTime = wakeUp;

        // 1. Morning Routine (25 min)
        entries.add(new TimetableEntry(UUID.randomUUID().toString(), formatTime(currentTime), formatTime(currentTime + 25), "Morning Routine", "Personal", "personal"));
        currentTime += 25;

        // 2. Exercise (25 min)
        entries.add(new TimetableEntry(UUID.randomUUID().toString(), formatTime(currentTime), formatTime(currentTime + 25), "Exercise / Yoga", "Health", "exercise"));
        currentTime += 25;

        // 3. Breakfast (20 min)
        entries.add(new TimetableEntry(UUID.randomUUID().toString(), formatTime(currentTime), formatTime(currentTime + 20), "Breakfast", "Meal", "meal"));
        currentTime += 20;

        int todayDay = LocalDate.now().getDayOfWeek().getValue() % 7; // Sunday = 0
        List<CollegeSlot> todaySlots = collegeSlots.stream()
                .filter(s -> s.getDay() == todayDay)
                .sorted(Comparator.comparingInt(s -> parseTime(s.getStartTime())))
                .collect(Collectors.toList());

        List<Task> pendingTasks = tasks.stream()
                .filter(t -> !Boolean.TRUE.equals(t.getCompleted()))
                .collect(Collectors.toList());

        int taskIdx = 0;
        int collegeIdx = 0;

        while (currentTime < sleep - 45) {
            // Check if there is an upcoming college slot starting now or in conflict
            if (collegeIdx < todaySlots.size()) {
                CollegeSlot nextCollege = todaySlots.get(collegeIdx);
                int cStart = parseTime(nextCollege.getStartTime());
                int cEnd = parseTime(nextCollege.getEndTime());

                if (currentTime >= cStart && currentTime < cEnd) {
                    entries.add(new TimetableEntry(UUID.randomUUID().toString(), formatTime(cStart), formatTime(cEnd), nextCollege.getSubject() + (nextCollege.getRoomOrCode() != null ? " (" + nextCollege.getRoomOrCode() + ")" : ""), "College", "college"));
                    currentTime = cEnd;
                    collegeIdx++;
                    continue;
                } else if (currentTime < cStart && cStart - currentTime < 30) {
                    // Small gap before college: quick prep/break
                    entries.add(new TimetableEntry(UUID.randomUUID().toString(), formatTime(currentTime), formatTime(cStart), "Transit & College Prep", "Break", "break"));
                    currentTime = cStart;
                    continue;
                }
            }

            // Lunch slot around 13:00 (780 mins)
            if (currentTime >= 750 && currentTime < 840) {
                entries.add(new TimetableEntry(UUID.randomUUID().toString(), formatTime(currentTime), formatTime(currentTime + 45), "Lunch & Rest", "Meal", "meal"));
                currentTime += 45;
                continue;
            }

            // Dinner slot around 20:00 (1200 mins)
            if (currentTime >= 1180 && currentTime < 1260) {
                entries.add(new TimetableEntry(UUID.randomUUID().toString(), formatTime(currentTime), formatTime(currentTime + 45), "Dinner & Relaxation", "Meal", "meal"));
                currentTime += 45;
                continue;
            }

            // Study task
            if (taskIdx < pendingTasks.size()) {
                Task t = pendingTasks.get(taskIdx);
                int duration = Math.min(t.getDuration() > 0 ? t.getDuration() : 45, 90);
                int sessionEnd = currentTime + duration;

                entries.add(new TimetableEntry(UUID.randomUUID().toString(), formatTime(currentTime), formatTime(sessionEnd), t.getTitle(), t.getSubject(), "study"));
                currentTime = sessionEnd;
                taskIdx++;

                // Add a 10 min break after study
                if (currentTime < sleep - 45) {
                    entries.add(new TimetableEntry(UUID.randomUUID().toString(), formatTime(currentTime), formatTime(currentTime + 10), "Short Refreshment Break", "Break", "break"));
                    currentTime += 10;
                }
            } else {
                // Generic study or revision session
                String defaultSubject = syllabusList.isEmpty() ? "Self Study & Revision" : syllabusList.get(0).getName();
                entries.add(new TimetableEntry(UUID.randomUUID().toString(), formatTime(currentTime), formatTime(currentTime + 45), "Deep Focus & Practice", defaultSubject, "study"));
                currentTime += 45;
                if (currentTime < sleep - 45) {
                    entries.add(new TimetableEntry(UUID.randomUUID().toString(), formatTime(currentTime), formatTime(currentTime + 15), "Relaxation Break", "Break", "break"));
                    currentTime += 15;
                }
            }
        }

        // Night Routine
        entries.add(new TimetableEntry(UUID.randomUUID().toString(), formatTime(sleep - 30), formatTime(sleep), "Night Routine & Wind Down", "Personal", "personal"));

        return ResponseEntity.ok(ApiResponse.ok(entries));
    }

    private int parseTime(String t) {
        try {
            String[] parts = t.split(":");
            return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
        } catch (Exception e) {
            return 360; // 06:00
        }
    }

    private String formatTime(int mins) {
        int h = (mins / 60) % 24;
        int m = mins % 60;
        return String.format("%02d:%02d", h, m);
    }
}
