package com.uit.studentplanner.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Data;

@Entity
@Table(name = "Notes")
@Data
public class Note {

    @Id
    @Column(name = "noteid")
    private Long noteId;

    @Column(name = "courseid")
    private Long courseId;

    @Column(name = "lessonsummary")
    private String lessonSummary;

    @Column(name = "homeworktasks")
    private String homeworkTasks;

    @Column(name = "deadline")
    private LocalDateTime deadline;
}
