package com.uit.studentplanner.controller;

import com.uit.studentplanner.entity.LessonNote;
import com.uit.studentplanner.entity.ClassSession;
import com.uit.studentplanner.repository.LessonNoteRepository;
import java.util.List;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lesson-notes")
public class LessonNoteController extends CrudController<LessonNote> {

    private final LessonNoteRepository repository;

    public LessonNoteController(LessonNoteRepository repository, MongoTemplate mongoTemplate) {
        super(repository, mongoTemplate, LessonNote.class);
        this.repository = repository;
    }

    @Override
    protected void setId(LessonNote entity, Long id) {
        entity.setNoteId(id);
    }

    @Override
    protected void validateReferences(LessonNote entity, Long userId) {
        requireOwnedResource(ClassSession.class, entity.getSessionId(), userId);
    }

    @GetMapping("/session/{sessionId}")
    public List<LessonNote> getBySessionId(@PathVariable Long sessionId) {
        Long userId = currentUserId();
        requireOwnedResource(ClassSession.class, sessionId, userId);
        return repository.findBySessionIdAndUserId(sessionId, userId);
    }
}
