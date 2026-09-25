package com.timeforge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class AnalyticsDtos {

    public static class RecordDayRequest {
        @NotBlank(message = "Date is required")
        private String date;

        @NotNull(message = "Timetable is required")
        private Object timetable;

        @NotNull(message = "Completion rate is required")
        private Integer completionRate;

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public Object getTimetable() { return timetable; }
        public void setTimetable(Object timetable) { this.timetable = timetable; }
        public Integer getCompletionRate() { return completionRate; }
        public void setCompletionRate(Integer completionRate) { this.completionRate = completionRate; }
    }

    public static class StatsResponse {
        private int currentStreak;
        private int totalStudyMinutes;
        private double averageCompletionRate;
        private int completedTasksCount;
        private List<DayRecordDto> history;

        public StatsResponse() {}

        public StatsResponse(int currentStreak, int totalStudyMinutes, double averageCompletionRate, int completedTasksCount, List<DayRecordDto> history) {
            this.currentStreak = currentStreak;
            this.totalStudyMinutes = totalStudyMinutes;
            this.averageCompletionRate = averageCompletionRate;
            this.completedTasksCount = completedTasksCount;
            this.history = history;
        }

        public int getCurrentStreak() { return currentStreak; }
        public void setCurrentStreak(int currentStreak) { this.currentStreak = currentStreak; }
        public int getTotalStudyMinutes() { return totalStudyMinutes; }
        public void setTotalStudyMinutes(int totalStudyMinutes) { this.totalStudyMinutes = totalStudyMinutes; }
        public double getAverageCompletionRate() { return averageCompletionRate; }
        public void setAverageCompletionRate(double averageCompletionRate) { this.averageCompletionRate = averageCompletionRate; }
        public int getCompletedTasksCount() { return completedTasksCount; }
        public void setCompletedTasksCount(int completedTasksCount) { this.completedTasksCount = completedTasksCount; }
        public List<DayRecordDto> getHistory() { return history; }
        public void setHistory(List<DayRecordDto> history) { this.history = history; }
    }

    public static class DayRecordDto {
        private String id;
        private String date;
        private Object timetable;
        private Integer completionRate;

        public DayRecordDto(String id, String date, Object timetable, Integer completionRate) {
            this.id = id;
            this.date = date;
            this.timetable = timetable;
            this.completionRate = completionRate;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public Object getTimetable() { return timetable; }
        public void setTimetable(Object timetable) { this.timetable = timetable; }
        public Integer getCompletionRate() { return completionRate; }
        public void setCompletionRate(Integer completionRate) { this.completionRate = completionRate; }
    }
}
