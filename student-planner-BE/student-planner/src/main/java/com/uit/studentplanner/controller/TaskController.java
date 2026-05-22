package com.uit.studentplanner.controller;

import com.uit.studentplanner.entity.Task;
import com.uit.studentplanner.repository.TaskRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
public class TaskController extends CrudController<Task> {

    private final TaskRepository repository;

    public TaskController(TaskRepository repository) {
        super(repository);
        this.repository = repository;
    }

    @Override
    protected void setId(Task entity, Long id) {
        entity.setTaskId(id);
    }

    @GetMapping("/session/{sessionId}")
    public List<Task> getBySessionId(@PathVariable Long sessionId) {
        return repository.findBySessionId(sessionId);
    }

    @GetMapping("/note/{noteId}")
    public List<Task> getByNoteId(@PathVariable Long noteId) {
        return repository.findByNoteId(noteId);
    }
}
