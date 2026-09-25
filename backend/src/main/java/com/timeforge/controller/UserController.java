package com.timeforge.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.timeforge.dto.ApiResponse;
import com.timeforge.dto.AuthDtos.UserProfileDto;
import com.timeforge.model.User;
import com.timeforge.repository.UserRepository;
import com.timeforge.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<?>> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }

        User user = userRepository.findById(principal.getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("User not found"));
        }

        return ResponseEntity.ok(ApiResponse.ok(toDto(user)));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<?>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }

        User user = userRepository.findById(principal.getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("User not found"));
        }

        if (body.containsKey("name")) user.setName((String) body.get("name"));
        if (body.containsKey("institution")) user.setInstitution((String) body.get("institution"));
        if (body.containsKey("course")) user.setCourse((String) body.get("course"));
        if (body.containsKey("semester")) user.setSemester((String) body.get("semester"));
        if (body.containsKey("studyHoursPerDay") && body.get("studyHoursPerDay") != null) {
            user.setStudyHoursPerDay(((Number) body.get("studyHoursPerDay")).intValue());
        }
        if (body.containsKey("wakeUpTime")) user.setWakeUpTime((String) body.get("wakeUpTime"));
        if (body.containsKey("sleepTime")) user.setSleepTime((String) body.get("sleepTime"));
        if (body.containsKey("goals")) {
            try {
                user.setGoals(objectMapper.writeValueAsString(body.get("goals")));
            } catch (Exception ignored) {}
        }

        user = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.ok(toDto(user)));
    }

    @PutMapping("/preferences")
    public ResponseEntity<ApiResponse<?>> updatePreferences(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        return updateProfile(principal, body);
    }

    private UserProfileDto toDto(User user) {
        UserProfileDto dto = new UserProfileDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setName(user.getName());
        dto.setInstitution(user.getInstitution());
        dto.setCourse(user.getCourse());
        dto.setSemester(user.getSemester());
        dto.setStudyHoursPerDay(user.getStudyHoursPerDay());
        dto.setWakeUpTime(user.getWakeUpTime());
        dto.setSleepTime(user.getSleepTime());
        try {
            dto.setGoals(objectMapper.readValue(user.getGoals() != null ? user.getGoals() : "[]", Object.class));
        } catch (Exception e) {
            dto.setGoals(new String[0]);
        }
        return dto;
    }
}
