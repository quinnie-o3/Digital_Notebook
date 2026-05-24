package com.uit.studentplanner.entity;

import java.time.LocalDateTime;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "refresh_tokens")
@Data
public class RefreshToken {

    @Id
    private Long refreshTokenId;

    @Indexed
    @Field("user_id")
    private Long userId;

    @Indexed(unique = true)
    @Field("token_hash")
    private String tokenHash;

    @Field("device_id")
    private String deviceId;

    @Field("created_at")
    private LocalDateTime createdAt;

    @Field("expires_at")
    private LocalDateTime expiresAt;

    @Field("revoked_at")
    private LocalDateTime revokedAt;
}
