package com.uit.studentplanner.entity;

import java.time.LocalDateTime;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "app_users")
@Data
public class AppUser {

    @Id
    private Long userId;

    @Indexed(unique = true)
    @Field("email")
    private String email;

    @Indexed(unique = true, sparse = true)
    @Field("username")
    private String username;

    @Field("password_hash")
    private String passwordHash;

    @Field("role")
    private String role;

    @Field("status")
    private String status;

    @Field("created_at")
    private LocalDateTime createdAt;

    @Field("updated_at")
    private LocalDateTime updatedAt;
}
