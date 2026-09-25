package com.timeforge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class ScheduleDtos {

    public static class CollegeSlotRequest {
        @NotNull(message = "Day is required")
        private Integer day;

        @NotBlank(message = "Start time is required")
        private String startTime;

        @NotBlank(message = "End time is required")
        private String endTime;

        @NotBlank(message = "Subject is required")
        private String subject;

        private String roomOrCode;

        public Integer getDay() { return day; }
        public void setDay(Integer day) { this.day = day; }
        public String getStartTime() { return startTime; }
        public void setStartTime(String startTime) { this.startTime = startTime; }
        public String getEndTime() { return endTime; }
        public void setEndTime(String endTime) { this.endTime = endTime; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getRoomOrCode() { return roomOrCode; }
        public void setRoomOrCode(String roomOrCode) { this.roomOrCode = roomOrCode; }
    }

    public static class SaveTimetableRequest {
        @NotBlank(message = "Name is required")
        private String name;

        @NotNull(message = "Entries are required")
        private Object entries;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public Object getEntries() { return entries; }
        public void setEntries(Object entries) { this.entries = entries; }
    }

    public static class GenerateScheduleRequest {
        private String date;
        private List<String> taskIds;
        private Integer dayOfWeek; // 0-6

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public List<String> getTaskIds() { return taskIds; }
        public void setTaskIds(List<String> taskIds) { this.taskIds = taskIds; }
        public Integer getDayOfWeek() { return dayOfWeek; }
        public void setDayOfWeek(Integer dayOfWeek) { this.dayOfWeek = dayOfWeek; }
    }

    public static class TimetableEntry {
        private String id;
        private String time;
        private String endTime;
        private String task;
        private String subject;
        private String type; // study, break, meal, exercise, personal, college
        private Boolean completed = false;

        public TimetableEntry() {}

        public TimetableEntry(String id, String time, String endTime, String task, String subject, String type) {
            this.id = id;
            this.time = time;
            this.endTime = endTime;
            this.task = task;
            this.subject = subject;
            this.type = type;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getTime() { return time; }
        public void setTime(String time) { this.time = time; }
        public String getEndTime() { return endTime; }
        public void setEndTime(String endTime) { this.endTime = endTime; }
        public String getTask() { return task; }
        public void setTask(String task) { this.task = task; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public Boolean getCompleted() { return completed; }
        public void setCompleted(Boolean completed) { this.completed = completed; }
    }
}
