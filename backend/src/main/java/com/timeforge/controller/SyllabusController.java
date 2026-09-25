package com.timeforge.controller;

import com.timeforge.dto.ApiResponse;
import com.timeforge.model.SubjectModule;
import com.timeforge.model.SyllabusFile;
import com.timeforge.repository.SyllabusFileRepository;
import com.timeforge.security.UserPrincipal;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/syllabus")
public class SyllabusController {

    private final SyllabusFileRepository syllabusFileRepository;

    public SyllabusController(SyllabusFileRepository syllabusFileRepository) {
        this.syllabusFileRepository = syllabusFileRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getSyllabusFiles(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));

        List<SyllabusFile> files = syllabusFileRepository.findByUserIdOrderByUploadedAtDesc(principal.getId());
        List<Map<String, Object>> response = files.stream().map(file -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", file.getId());
            map.put("name", file.getName());
            map.put("subject", file.getSubject());
            map.put("uploadedAt", file.getUploadedAt());
            map.put("url", "/api/syllabus/" + file.getId() + "/download");

            List<Map<String, Object>> moduleList = file.getModules().stream().map(m -> {
                Map<String, Object> mod = new HashMap<>();
                mod.put("id", m.getId());
                mod.put("name", m.getName());
                mod.put("estimatedHours", m.getEstimatedHours());
                return mod;
            }).collect(Collectors.toList());

            map.put("modules", moduleList);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<?>> uploadSyllabusFile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("name") String name,
            @RequestParam("subject") String subject,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));

        SyllabusFile syllabus = new SyllabusFile();
        syllabus.setName(name);
        syllabus.setSubject(subject);
        syllabus.setUserId(principal.getId());

        if (file != null && !file.isEmpty()) {
            try {
                syllabus.setFileData(file.getBytes());
            } catch (Exception ignored) {}
        } else {
            syllabus.setFileData(new byte[0]);
        }

        // Add 4 standard curriculum modules
        List<SubjectModule> defaultModules = new ArrayList<>();
        defaultModules.add(new SubjectModule("Unit 1: Fundamentals & Core Concepts", 6.0, syllabus));
        defaultModules.add(new SubjectModule("Unit 2: Architecture & Implementation", 8.0, syllabus));
        defaultModules.add(new SubjectModule("Unit 3: Advanced Topics & Algorithms", 10.0, syllabus));
        defaultModules.add(new SubjectModule("Unit 4: Applications & Case Studies", 6.0, syllabus));
        syllabus.setModules(defaultModules);

        syllabus = syllabusFileRepository.save(syllabus);

        Map<String, Object> map = new HashMap<>();
        map.put("id", syllabus.getId());
        map.put("name", syllabus.getName());
        map.put("subject", syllabus.getSubject());
        map.put("uploadedAt", syllabus.getUploadedAt());
        map.put("url", "/api/syllabus/" + syllabus.getId() + "/download");
        map.put("modules", syllabus.getModules());

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(map));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<?> downloadSyllabus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        SyllabusFile file = syllabusFileRepository.findByIdAndUserId(id, principal.getId()).orElse(null);
        if (file == null || file.getFileData() == null || file.getFileData().length == 0) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(file.getFileData());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> removeSyllabus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));

        SyllabusFile file = syllabusFileRepository.findByIdAndUserId(id, principal.getId()).orElse(null);
        if (file == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Syllabus not found or unauthorized"));
        }

        syllabusFileRepository.delete(file);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("id", id)));
    }
}
