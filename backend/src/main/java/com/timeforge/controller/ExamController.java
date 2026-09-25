package com.timeforge.controller;

import com.timeforge.dto.ApiResponse;
import com.timeforge.dto.ExamDtos.CreateExamRequest;
import com.timeforge.dto.ExamDtos.UpdateExamRequest;
import com.timeforge.model.Exam;
import com.timeforge.repository.ExamRepository;
import com.timeforge.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exams")
public class ExamController {

    private final ExamRepository examRepository;

    public ExamController(ExamRepository examRepository) {
        this.examRepository = examRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getExams(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }

        List<Exam> exams = examRepository.findByUserIdOrderByDateAsc(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(exams));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<?>> addExam(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateExamRequest req) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }

        Exam exam = new Exam();
        exam.setTitle(req.getTitle());
        exam.setSubject(req.getSubject());
        exam.setDate(req.getDate());
        exam.setTime(req.getTime());
        exam.setNotes(req.getNotes());
        exam.setUserId(principal.getId());

        exam = examRepository.save(exam);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(exam));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> updateExam(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @RequestBody UpdateExamRequest req) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }

        Exam exam = examRepository.findByIdAndUserId(id, principal.getId()).orElse(null);
        if (exam == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Exam not found or unauthorized"));
        }

        if (req.getTitle() != null) exam.setTitle(req.getTitle());
        if (req.getSubject() != null) exam.setSubject(req.getSubject());
        if (req.getDate() != null) exam.setDate(req.getDate());
        if (req.getTime() != null) exam.setTime(req.getTime());
        if (req.getNotes() != null) exam.setNotes(req.getNotes());

        exam = examRepository.save(exam);
        return ResponseEntity.ok(ApiResponse.ok(exam));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> removeExam(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }

        Exam exam = examRepository.findByIdAndUserId(id, principal.getId()).orElse(null);
        if (exam == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Exam not found or unauthorized"));
        }

        examRepository.delete(exam);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("id", id)));
    }
}
