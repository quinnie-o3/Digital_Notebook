package com.uit.studentplanner.controller;

import com.uit.studentplanner.entity.Timetable;
import com.uit.studentplanner.repository.TimetableRepository;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/timetables")
public class TimetableController extends CrudController<Timetable> {

    private final TimetableRepository repository;

    public TimetableController(TimetableRepository repository, MongoTemplate mongoTemplate) {
        super(repository, mongoTemplate, Timetable.class);
        this.repository = repository;
    }

    @Override
    protected void setId(Timetable entity, Long id) {
        entity.setTimetableId(id);
    }

}
