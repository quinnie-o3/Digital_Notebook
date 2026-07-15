package com.uit.studentplanner.controller;

import com.uit.studentplanner.entity.Task;
import com.uit.studentplanner.entity.ClassSession;
import com.uit.studentplanner.entity.LessonNote;
import com.uit.studentplanner.repository.TaskRepository;
import java.util.List;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
public class TaskController extends CrudController<Task> {

    private final TaskRepository repository;

    public TaskController(TaskRepository repository, MongoTemplate mongoTemplate) {
        super(repository, mongoTemplate, Task.class);
        this.repository = repository;
    }

    @Override
    protected void setId(Task entity, Long id) {
        entity.setTaskId(id);
    }

    @Override
    protected void validateReferences(Task entity, Long userId) {
        requireOwnedResource(ClassSession.class, entity.getSessionId(), userId);
        if (entity.getNoteId() != null) {
            requireOwnedResource(LessonNote.class, entity.getNoteId(), userId);
        }
    }

    @GetMapping("/session/{sessionId}")
    public List<Task> getBySessionId(@PathVariable Long sessionId) {
        Long userId = currentUserId();
        requireOwnedResource(ClassSession.class, sessionId, userId);
        return repository.findBySessionIdAndUserId(sessionId, userId);
    }

    @GetMapping("/note/{noteId}")
    public List<Task> getByNoteId(@PathVariable Long noteId) {
        Long userId = currentUserId();
        requireOwnedResource(LessonNote.class, noteId, userId);
        return repository.findByNoteIdAndUserId(noteId, userId);
    }
}
