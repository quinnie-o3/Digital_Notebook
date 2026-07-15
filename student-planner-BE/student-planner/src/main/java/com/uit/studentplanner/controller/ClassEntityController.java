package com.uit.studentplanner.controller;

import com.uit.studentplanner.entity.ClassEntity;
import com.uit.studentplanner.entity.Subject;
import com.uit.studentplanner.entity.Timetable;
import com.uit.studentplanner.repository.ClassEntityRepository;
import java.util.List;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/classes")
public class ClassEntityController extends CrudController<ClassEntity> {

    private final ClassEntityRepository repository;

    public ClassEntityController(ClassEntityRepository repository, MongoTemplate mongoTemplate) {
        super(repository, mongoTemplate, ClassEntity.class);
        this.repository = repository;
    }

    @Override
    protected void setId(ClassEntity entity, Long id) {
        entity.setClassId(id);
    }

    @Override
    protected void validateReferences(ClassEntity entity, Long userId) {
        requireOwnedResource(Timetable.class, entity.getTimetableId(), userId);
        requireOwnedResource(Subject.class, entity.getSubjectId(), userId);
    }

    @GetMapping("/timetable/{timetableId}")
    public List<ClassEntity> getByTimetableId(@PathVariable Long timetableId) {
        Long userId = currentUserId();
        requireOwnedResource(Timetable.class, timetableId, userId);
        return repository.findByTimetableIdAndUserId(timetableId, userId);
    }

    @GetMapping("/subject/{subjectId}")
    public List<ClassEntity> getBySubjectId(@PathVariable Long subjectId) {
        Long userId = currentUserId();
        requireOwnedResource(Subject.class, subjectId, userId);
        return repository.findBySubjectIdAndUserId(subjectId, userId);
    }
}
