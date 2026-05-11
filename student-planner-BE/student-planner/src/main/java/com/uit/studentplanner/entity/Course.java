package com.uit.studentplanner.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "courses")
@Data
public class Course {

    @Id
    @Column(name = "courseid")
    private Long courseId;

    @Column(name = "coursename", nullable = false)
    private String courseName;

    @Column(name = "dayofweek")
    private String dayOfWeek;

    @Column(name = "starttime")
    private String startTime;

    @Column(name = "endtime")
    private String endTime;

    @Column(name = "colorcode")
    private String colorCode;
}
