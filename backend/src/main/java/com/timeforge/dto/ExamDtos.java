package com.timeforge.dto;

import jakarta.validation.constraints.NotBlank;

public class ExamDtos {

    public static class CreateExamRequest {
        @NotBlank(message = "Title is required")
        private String title;

        @NotBlank(message = "Subject is required")
        private String subject;

        @NotBlank(message = "Date is required")
        private String date;

        private String time;
        private String notes;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public String getTime() { return time; }
        public void setTime(String time) { this.time = time; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class UpdateExamRequest {
        private String title;
        private String subject;
        private String date;
        private String time;
        private String notes;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public String getTime() { return time; }
        public void setTime(String time) { this.time = time; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }
}
