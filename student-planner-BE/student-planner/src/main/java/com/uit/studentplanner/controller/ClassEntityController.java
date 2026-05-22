package com.uit.studentplanner.controller;

import com.uit.studentplanner.entity.ClassEntity;
import com.uit.studentplanner.repository.ClassEntityRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/classes")
public class ClassEntityController extends CrudController<ClassEntity> {

    private final ClassEntityRepository repository;

    public ClassEntityController(ClassEntityRepository repository) {
        super(repository);
        this.repository = repository;
    }

    @Override
    protected void setId(ClassEntity entity, Long id) {
        entity.setClassId(id);
    }

    @GetMapping("/timetable/{timetableId}")
    public List<ClassEntity> getByTimetableId(@PathVariable Long timetableId) {
        return repository.findByTimetableId(timetableId);
    }

    @GetMapping("/subject/{subjectId}")
    public List<ClassEntity> getBySubjectId(@PathVariable Long subjectId) {
        return repository.findBySubjectId(subjectId);
    }
}
