package com.uit.studentplanner.entity;

import java.time.LocalDateTime;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "classes")
@Data
public class ClassEntity implements OwnedResource {

    @Id
    private Long classId;

    @Field("user_id")
    @Indexed
    private Long userId;

    @Field("timetable_id")
    private Long timetableId;

    @Field("subject_id")
    private Long subjectId;

    @Field("teacher_name")
    private String teacherName;

    @Field("default_room")
    private String defaultRoom;

    @Field("created_type")
    private String createdType;

    @Field("created_at")
    private LocalDateTime createdAt;

    @Field("updated_at")
    private LocalDateTime updatedAt;
}
