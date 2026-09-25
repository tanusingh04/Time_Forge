package com.timeforge.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "college_slots")
public class CollegeSlot {
    @Id
    private String id = UUID.randomUUID().toString();

    @Column(name = "slot_day", nullable = false)
    private Integer day;

    @Column(nullable = false)
    private String startTime;

    @Column(nullable = false)
    private String endTime;

    @Column(nullable = false)
    private String subject;

    private String roomOrCode;

    @Column(nullable = false)
    private String userId;

    public CollegeSlot() {}

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
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
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}
