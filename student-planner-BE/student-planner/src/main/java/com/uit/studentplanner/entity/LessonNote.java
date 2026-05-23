package com.uit.studentplanner.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "lesson_notes")
@Data
public class LessonNote {

    @Id
    private Long noteId;

    @Field("session_id")
    private Long sessionId;

    @Field("note_date")
    private LocalDate noteDate;

    @Field("lesson_summary")
    private String lessonSummary;

    @Field("review_notes")
    private String reviewNotes;

    @Field("created_at")
    private LocalDateTime createdAt;

    @Field("updated_at")
    private LocalDateTime updatedAt;
}
