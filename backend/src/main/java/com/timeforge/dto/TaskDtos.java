package com.timeforge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class TaskDtos {

    public static class CreateTaskRequest {
        @NotBlank(message = "Title is required")
        private String title;

        @NotBlank(message = "Subject is required")
        private String subject;

        @NotNull(message = "Duration is required")
        private Integer duration;

        private String priority = "medium";
        private Boolean completed = false;
        private String scheduledTime;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public Integer getDuration() { return duration; }
        public void setDuration(Integer duration) { this.duration = duration; }
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
        public Boolean getCompleted() { return completed; }
        public void setCompleted(Boolean completed) { this.completed = completed; }
        public String getScheduledTime() { return scheduledTime; }
        public void setScheduledTime(String scheduledTime) { this.scheduledTime = scheduledTime; }
    }

    public static class UpdateTaskRequest {
        private String title;
        private String subject;
        private Integer duration;
        private String priority;
        private Boolean completed;
        private String scheduledTime;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public Integer getDuration() { return duration; }
        public void setDuration(Integer duration) { this.duration = duration; }
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
        public Boolean getCompleted() { return completed; }
        public void setCompleted(Boolean completed) { this.completed = completed; }
        public String getScheduledTime() { return scheduledTime; }
        public void setScheduledTime(String scheduledTime) { this.scheduledTime = scheduledTime; }
    }
}
