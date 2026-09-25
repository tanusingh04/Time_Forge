package com.timeforge.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public static class RegisterRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        @NotBlank(message = "Name is required")
        private String name;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class AuthResponse {
        private String token;
        private UserSummary user;

        public AuthResponse(String token, UserSummary user) {
            this.token = token;
            this.user = user;
        }

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public UserSummary getUser() { return user; }
        public void setUser(UserSummary user) { this.user = user; }
    }

    public static class UserSummary {
        private String id;
        private String email;
        private String name;

        public UserSummary(String id, String email, String name) {
            this.id = id;
            this.email = email;
            this.name = name;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    public static class UserProfileDto {
        private String id;
        private String email;
        private String name;
        private String institution;
        private String course;
        private String semester;
        private Integer studyHoursPerDay;
        private String wakeUpTime;
        private String sleepTime;
        private Object goals;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getInstitution() { return institution; }
        public void setInstitution(String institution) { this.institution = institution; }
        public String getCourse() { return course; }
        public void setCourse(String course) { this.course = course; }
        public String getSemester() { return semester; }
        public void setSemester(String semester) { this.semester = semester; }
        public Integer getStudyHoursPerDay() { return studyHoursPerDay; }
        public void setStudyHoursPerDay(Integer studyHoursPerDay) { this.studyHoursPerDay = studyHoursPerDay; }
        public String getWakeUpTime() { return wakeUpTime; }
        public void setWakeUpTime(String wakeUpTime) { this.wakeUpTime = wakeUpTime; }
        public String getSleepTime() { return sleepTime; }
        public void setSleepTime(String sleepTime) { this.sleepTime = sleepTime; }
        public Object getGoals() { return goals; }
        public void setGoals(Object goals) { this.goals = goals; }
    }
}
