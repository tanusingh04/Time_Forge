package com.timeforge.controller;

import com.timeforge.dto.ApiResponse;
import com.timeforge.dto.TaskDtos.CreateTaskRequest;
import com.timeforge.dto.TaskDtos.UpdateTaskRequest;
import com.timeforge.model.Task;
import com.timeforge.repository.TaskRepository;
import com.timeforge.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskRepository taskRepository;

    public TaskController(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getTasks(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean completed,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String order) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }

        List<Task> tasks = taskRepository.findByUserId(principal.getId());

        if (q != null && !q.isBlank()) {
            String lower = q.toLowerCase();
            tasks = tasks.stream()
                    .filter(t -> (t.getTitle() != null && t.getTitle().toLowerCase().contains(lower)) ||
                                 (t.getSubject() != null && t.getSubject().toLowerCase().contains(lower)))
                    .collect(Collectors.toList());
        }

        if (completed != null) {
            tasks = tasks.stream()
                    .filter(t -> t.getCompleted().equals(completed))
                    .collect(Collectors.toList());
        }

        if (priority != null && !priority.isBlank()) {
            tasks = tasks.stream()
                    .filter(t -> priority.equalsIgnoreCase(t.getPriority()))
                    .collect(Collectors.toList());
        }

        boolean isDesc = !"asc".equalsIgnoreCase(order);
        if ("title".equalsIgnoreCase(sortBy)) {
            tasks.sort(isDesc ? Comparator.comparing(Task::getTitle).reversed() : Comparator.comparing(Task::getTitle));
        } else if ("duration".equalsIgnoreCase(sortBy)) {
            tasks.sort(isDesc ? Comparator.comparing(Task::getDuration).reversed() : Comparator.comparing(Task::getDuration));
        } else {
            tasks.sort(isDesc ? Comparator.comparing(Task::getCreatedAt).reversed() : Comparator.comparing(Task::getCreatedAt));
        }

        return ResponseEntity.ok(ApiResponse.ok(tasks));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<?>> createTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateTaskRequest req) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }

        Task task = new Task();
        task.setTitle(req.getTitle());
        task.setSubject(req.getSubject());
        task.setDuration(req.getDuration());
        task.setPriority(req.getPriority() != null ? req.getPriority() : "medium");
        task.setCompleted(req.getCompleted() != null ? req.getCompleted() : false);
        task.setScheduledTime(req.getScheduledTime());
        task.setUserId(principal.getId());

        task = taskRepository.save(task);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(task));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> updateTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @RequestBody UpdateTaskRequest req) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }

        Task task = taskRepository.findByIdAndUserId(id, principal.getId()).orElse(null);
        if (task == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Task not found or unauthorized"));
        }

        if (req.getTitle() != null) task.setTitle(req.getTitle());
        if (req.getSubject() != null) task.setSubject(req.getSubject());
        if (req.getDuration() != null) task.setDuration(req.getDuration());
        if (req.getPriority() != null) task.setPriority(req.getPriority());
        if (req.getCompleted() != null) task.setCompleted(req.getCompleted());
        if (req.getScheduledTime() != null) task.setScheduledTime(req.getScheduledTime());

        task = taskRepository.save(task);
        return ResponseEntity.ok(ApiResponse.ok(task));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<?>> toggleTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }

        Task task = taskRepository.findByIdAndUserId(id, principal.getId()).orElse(null);
        if (task == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Task not found"));
        }

        task.setCompleted(!task.getCompleted());
        task = taskRepository.save(task);
        return ResponseEntity.ok(ApiResponse.ok(task));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> deleteTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }

        Task task = taskRepository.findByIdAndUserId(id, principal.getId()).orElse(null);
        if (task == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Task not found or unauthorized"));
        }

        taskRepository.delete(task);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("id", id)));
    }
}
