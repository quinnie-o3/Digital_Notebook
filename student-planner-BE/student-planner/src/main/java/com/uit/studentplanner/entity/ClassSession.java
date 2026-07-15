package com.uit.studentplanner.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "class_sessions")
@Data
public class ClassSession implements OwnedResource {

    @Id
    private Long sessionId;

    @Field("user_id")
    @Indexed
    private Long userId;

    @Field("class_id")
    private Long classId;

    @Field("day_of_week")
    private Integer dayOfWeek;

    @Field("start_time")
    private String startTime;

    @Field("end_time")
    private String endTime;

    @Field("room")
    private String room;

    @Field("start_date")
    private LocalDate startDate;

    @Field("end_date")
    private LocalDate endDate;

    @Field("created_at")
    private LocalDateTime createdAt;

    @Field("updated_at")
    private LocalDateTime updatedAt;
}
