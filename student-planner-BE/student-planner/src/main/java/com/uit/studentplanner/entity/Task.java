package com.uit.studentplanner.entity;

import java.time.LocalDateTime;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "tasks")
@Data
public class Task implements OwnedResource {

    @Id
    private Long taskId;

    @Field("user_id")
    @Indexed
    private Long userId;

    @Field("note_id")
    private Long noteId;

    @Field("session_id")
    private Long sessionId;

    @Field("title")
    private String title;

    @Field("description")
    private String description;

    @Field("deadline")
    private LocalDateTime deadline;

    @Field("status")
    private String status;

    @Field("priority")
    private String priority;

    @Field("created_at")
    private LocalDateTime createdAt;

    @Field("updated_at")
    private LocalDateTime updatedAt;
}
