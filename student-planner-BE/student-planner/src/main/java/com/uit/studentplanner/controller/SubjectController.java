package com.uit.studentplanner.controller;

import com.uit.studentplanner.entity.Subject;
import com.uit.studentplanner.repository.SubjectRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController extends CrudController<Subject> {

    private final SubjectRepository repository;

    public SubjectController(SubjectRepository repository) {
        super(repository);
        this.repository = repository;
    }

    @Override
    protected void setId(Subject entity, Long id) {
        entity.setSubjectId(id);
    }

    @GetMapping("/user/{userId}")
    public List<Subject> getByUserId(@PathVariable Long userId) {
        return repository.findByUserId(userId);
    }
}
