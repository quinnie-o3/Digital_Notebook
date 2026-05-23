package com.uit.studentplanner.entity;

import java.time.LocalDateTime;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "user_profiles")
@Data
public class UserProfile {

    @Id
    private Long profileId;

    @Field("user_id")
    private Long userId;

    @Field("full_name")
    private String fullName;

    @Indexed(unique = true, sparse = true)
    @Field("student_code")
    private String studentCode;

    @Field("school_name")
    private String schoolName;

    @Field("faculty")
    private String faculty;

    @Field("major")
    private String major;

    @Field("class_name")
    private String className;

    @Field("avatar_url")
    private String avatarUrl;

    @Field("created_at")
    private LocalDateTime createdAt;

    @Field("updated_at")
    private LocalDateTime updatedAt;
}
