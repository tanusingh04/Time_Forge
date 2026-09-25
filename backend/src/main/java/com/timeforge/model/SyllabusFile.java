package com.timeforge.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "syllabus_files")
public class SyllabusFile {
    @Id
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false)
    private String name;

    private String subject;

    private LocalDateTime uploadedAt = LocalDateTime.now();

    @JsonIgnore
    @Lob
    @Basic(fetch = FetchType.LAZY)
    private byte[] fileData;

    @OneToMany(mappedBy = "syllabusFile", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<SubjectModule> modules = new ArrayList<>();

    @Column(nullable = false)
    private String userId;

    public SyllabusFile() {}

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        uploadedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
    public byte[] getFileData() { return fileData; }
    public void setFileData(byte[] fileData) { this.fileData = fileData; }
    public List<SubjectModule> getModules() { return modules; }
    public void setModules(List<SubjectModule> modules) { this.modules = modules; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}
