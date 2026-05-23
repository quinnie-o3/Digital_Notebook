package com.uit.studentplanner.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "timetables")
@Data
public class Timetable {

    @Id
    private Long timetableId;

    @Field("user_id")
    private Long userId;

    @Field("name")
    private String name;

    @Field("semester_name")
    private String semesterName;

    @Field("start_date")
    private LocalDate startDate;

    @Field("end_date")
    private LocalDate endDate;

    @Field("is_active")
    private Integer active;

    @Field("created_at")
    private LocalDateTime createdAt;

    @Field("updated_at")
    private LocalDateTime updatedAt;
}
