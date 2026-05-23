package com.uit.studentplanner.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "import_items")
@Data
public class ImportItem {

    @Id
    private Long itemId;

    @Field("import_id")
    private Long importId;

    @Field("raw_text")
    private String rawText;

    @Field("subject_name")
    private String subjectName;

    @Field("day_of_week")
    private Integer dayOfWeek;

    @Field("start_time")
    private String startTime;

    @Field("end_time")
    private String endTime;

    @Field("room")
    private String room;

    @Field("confidence_score")
    private BigDecimal confidenceScore;

    @Field("status")
    private String status;

    @Field("created_at")
    private LocalDateTime createdAt;
}
