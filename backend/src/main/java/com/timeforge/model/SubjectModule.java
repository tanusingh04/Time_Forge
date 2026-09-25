package com.timeforge.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "subject_modules")
public class SubjectModule {
    @Id
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false)
    private String name;

    private Double estimatedHours;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "syllabus_file_id", nullable = false)
    private SyllabusFile syllabusFile;

    public SubjectModule() {}

    public SubjectModule(String name, Double estimatedHours, SyllabusFile syllabusFile) {
        this.name = name;
        this.estimatedHours = estimatedHours;
        this.syllabusFile = syllabusFile;
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Double getEstimatedHours() { return estimatedHours; }
    public void setEstimatedHours(Double estimatedHours) { this.estimatedHours = estimatedHours; }
    public SyllabusFile getSyllabusFile() { return syllabusFile; }
    public void setSyllabusFile(SyllabusFile syllabusFile) { this.syllabusFile = syllabusFile; }
}
