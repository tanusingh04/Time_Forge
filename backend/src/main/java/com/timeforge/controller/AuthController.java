package com.timeforge.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.timeforge.dto.ApiResponse;
import com.timeforge.dto.AuthDtos.*;
import com.timeforge.model.User;
import com.timeforge.repository.UserRepository;
import com.timeforge.security.JwtUtil;
import com.timeforge.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<?>> register(@Valid @RequestBody RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email already registered"));
        }

        User user = new User();
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setName(req.getName());

        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        UserSummary summary = new UserSummary(user.getId(), user.getEmail(), user.getName());
        AuthResponse response = new AuthResponse(token, summary);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<?>> login(@Valid @RequestBody LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail()).orElse(null);
        if (user == null || !passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Invalid email or password"));
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        UserSummary summary = new UserSummary(user.getId(), user.getEmail(), user.getName());
        AuthResponse response = new AuthResponse(token, summary);

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<?>> getMe(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Not authenticated"));
        }

        User user = userRepository.findById(principal.getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("User not found"));
        }

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

        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<?>> logout() {
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Logged out successfully")));
    }
}
