package com.uit.studentplanner.controller;

import com.uit.studentplanner.service.ScheduleImportService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/planner-import")
public class PlannerImportController {

    private final ScheduleImportService importService;

    public PlannerImportController(ScheduleImportService importService) {
        this.importService = importService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void importSchedule(@RequestBody ScheduleImportRequest request) {
        importService.importSchedule(request);
    }

    public record ScheduleImportRequest(String mode, List<ScheduleItemRequest> subjects) {
    }

    public record ScheduleItemRequest(
            String name,
            String courseCode,
            String color,
            Integer day,
            String startTime,
            String endTime,
            String room,
            LocalDate startDate,
            LocalDate endDate
    ) {
    }
}
