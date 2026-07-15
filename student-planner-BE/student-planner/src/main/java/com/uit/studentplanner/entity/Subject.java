package com.uit.studentplanner.entity;

import java.time.LocalDateTime;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "subjects")
@Data
public class Subject implements OwnedResource {

    @Id
    private Long subjectId;

    @Field("user_id")
    @Indexed
    private Long userId;

    @Field("subject_name")
    private String subjectName;

    @Field("subject_code")
    private String subjectCode;

    @Field("color_code")
    private String colorCode;

    @Field("created_at")
    private LocalDateTime createdAt;

    @Field("updated_at")
    private LocalDateTime updatedAt;
}
