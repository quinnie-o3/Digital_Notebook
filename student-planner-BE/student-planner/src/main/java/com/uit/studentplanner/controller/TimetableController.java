package com.uit.studentplanner.controller;

import com.uit.studentplanner.entity.Timetable;
import com.uit.studentplanner.repository.TimetableRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/timetables")
public class TimetableController extends CrudController<Timetable> {

    private final TimetableRepository repository;

    public TimetableController(TimetableRepository repository) {
        super(repository);
        this.repository = repository;
    }

    @Override
    protected void setId(Timetable entity, Long id) {
        entity.setTimetableId(id);
    }

    @GetMapping("/user/{userId}")
    public List<Timetable> getByUserId(@PathVariable Long userId) {
        return repository.findByUserId(userId);
    }
}
