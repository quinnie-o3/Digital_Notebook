package com.uit.studentplanner.controller;

import com.uit.studentplanner.entity.LessonNote;
import com.uit.studentplanner.repository.LessonNoteRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lesson-notes")
public class LessonNoteController extends CrudController<LessonNote> {

    private final LessonNoteRepository repository;

    public LessonNoteController(LessonNoteRepository repository) {
        super(repository);
        this.repository = repository;
    }

    @Override
    protected void setId(LessonNote entity, Long id) {
        entity.setNoteId(id);
    }

    @GetMapping("/session/{sessionId}")
    public List<LessonNote> getBySessionId(@PathVariable Long sessionId) {
        return repository.findBySessionId(sessionId);
    }
}
