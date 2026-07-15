package com.uit.studentplanner.controller;

import com.uit.studentplanner.entity.Subject;
import com.uit.studentplanner.repository.SubjectRepository;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController extends CrudController<Subject> {

    private final SubjectRepository repository;

    public SubjectController(SubjectRepository repository, MongoTemplate mongoTemplate) {
        super(repository, mongoTemplate, Subject.class);
        this.repository = repository;
    }

    @Override
    protected void setId(Subject entity, Long id) {
        entity.setSubjectId(id);
    }

}
