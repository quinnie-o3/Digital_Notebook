package com.uit.studentplanner.controller;

import com.uit.studentplanner.entity.ImportFile;
import com.uit.studentplanner.repository.ImportFileRepository;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/import-files")
public class ImportFileController extends CrudController<ImportFile> {

    private final ImportFileRepository repository;

    public ImportFileController(ImportFileRepository repository, MongoTemplate mongoTemplate) {
        super(repository, mongoTemplate, ImportFile.class);
        this.repository = repository;
    }

    @Override
    protected void setId(ImportFile entity, Long id) {
        entity.setImportId(id);
    }

}
