package com.timeforge.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.timeforge.dto.AnalyticsDtos.RecordDayRequest;
import com.timeforge.dto.ApiResponse;
import com.timeforge.model.DayRecord;
import com.timeforge.model.Task;
import com.timeforge.repository.DayRecordRepository;
import com.timeforge.repository.TaskRepository;
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
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final DayRecordRepository dayRecordRepository;
    private final TaskRepository taskRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AnalyticsController(DayRecordRepository dayRecordRepository, TaskRepository taskRepository) {
        this.dayRecordRepository = dayRecordRepository;
        this.taskRepository = taskRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAnalytics(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));

        String userId = principal.getId();
        List<Task> tasks = taskRepository.findByUserId(userId);
        long totalTasks = tasks.size();
        long completedTasks = tasks.stream().filter(t -> Boolean.TRUE.equals(t.getCompleted())).count();
        long pendingTasks = totalTasks - completedTasks;

        List<DayRecord> history = dayRecordRepository.findByUserIdOrderByDateDesc(userId);

        Set<String> dates = history.stream().map(DayRecord::getDate).collect(Collectors.toSet());
        int streak = 0;
        LocalDate checkDate = LocalDate.now();
        if (!dates.contains(checkDate.toString())) {
            checkDate = checkDate.minusDays(1);
        }

        while (dates.contains(checkDate.toString())) {
            streak++;
            checkDate = checkDate.minusDays(1);
        }

        int avgCompletionRate = history.isEmpty() ? 0 :
                (int) Math.round(history.stream().mapToInt(DayRecord::getCompletionRate).average().orElse(0.0));

        List<Map<String, Object>> historyList = history.stream().map(h -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", h.getId());
            map.put("date", h.getDate());
            map.put("completionRate", h.getCompletionRate());
            try {
                map.put("timetable", objectMapper.readValue(h.getTimetable(), Object.class));
            } catch (Exception e) {
                map.put("timetable", Collections.emptyList());
            }
            return map;
        }).collect(Collectors.toList());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTasks", totalTasks);
        stats.put("completedTasks", completedTasks);
        stats.put("pendingTasks", pendingTasks);
        stats.put("streak", streak);
        stats.put("avgCompletionRate", avgCompletionRate);
        stats.put("history", historyList);

        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<?>> getHistory(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));

        List<DayRecord> history = dayRecordRepository.findByUserIdOrderByDateDesc(principal.getId());
        List<Map<String, Object>> historyList = history.stream().map(h -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", h.getId());
            map.put("date", h.getDate());
            map.put("completionRate", h.getCompletionRate());
            try {
                map.put("timetable", objectMapper.readValue(h.getTimetable(), Object.class));
            } catch (Exception e) {
                map.put("timetable", Collections.emptyList());
            }
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(historyList));
    }

    @PostMapping("/record")
    public ResponseEntity<ApiResponse<?>> recordDay(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RecordDayRequest req) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));

        DayRecord record = dayRecordRepository.findByUserIdAndDate(principal.getId(), req.getDate())
                .orElse(new DayRecord());

        record.setDate(req.getDate());
        record.setCompletionRate(req.getCompletionRate());
        record.setUserId(principal.getId());

        try {
            record.setTimetable(objectMapper.writeValueAsString(req.getTimetable()));
        } catch (Exception e) {
            record.setTimetable("[]");
        }

        record = dayRecordRepository.save(record);
        return ResponseEntity.ok(ApiResponse.ok(record));
    }
}
