package com.uit.studentplanner.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;

@Entity
@Table(name = "lesson_notes")
@Data
public class LessonNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "note_id")
    private Long noteId;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "note_date")
    private LocalDate noteDate;

    @Column(name = "lesson_summary")
    private String lessonSummary;

    @Column(name = "review_notes")
    private String reviewNotes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
