package com.uit.studentplanner.controller;

import com.uit.studentplanner.entity.ClassSession;
import com.uit.studentplanner.entity.ClassEntity;
import com.uit.studentplanner.repository.ClassSessionRepository;
import java.util.List;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/class-sessions")
public class ClassSessionController extends CrudController<ClassSession> {

    private final ClassSessionRepository repository;

    public ClassSessionController(ClassSessionRepository repository, MongoTemplate mongoTemplate) {
        super(repository, mongoTemplate, ClassSession.class);
        this.repository = repository;
    }

    @Override
    protected void setId(ClassSession entity, Long id) {
        entity.setSessionId(id);
    }

    @Override
    protected void validateReferences(ClassSession entity, Long userId) {
        requireOwnedResource(ClassEntity.class, entity.getClassId(), userId);
    }

    @GetMapping("/class/{classId}")
    public List<ClassSession> getByClassId(@PathVariable Long classId) {
        Long userId = currentUserId();
        requireOwnedResource(ClassEntity.class, classId, userId);
        return repository.findByClassIdAndUserId(classId, userId);
    }
}
