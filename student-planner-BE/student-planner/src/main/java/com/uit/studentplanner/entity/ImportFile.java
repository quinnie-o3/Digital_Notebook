package com.uit.studentplanner.entity;

import java.time.LocalDateTime;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "import_files")
@Data
public class ImportFile {

    @Id
    private Long importId;

    @Field("user_id")
    private Long userId;

    @Field("file_name")
    private String fileName;

    @Field("file_type")
    private String fileType;

    @Field("file_url")
    private String fileUrl;

    @Field("status")
    private String status;

    @Field("error_message")
    private String errorMessage;

    @Field("created_at")
    private LocalDateTime createdAt;

    @Field("updated_at")
    private LocalDateTime updatedAt;
}
