package com.uit.studentplanner.controller;

import com.uit.studentplanner.entity.ImportFile;
import com.uit.studentplanner.repository.ImportFileRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/import-files")
public class ImportFileController extends CrudController<ImportFile> {

    private final ImportFileRepository repository;

    public ImportFileController(ImportFileRepository repository) {
        super(repository);
        this.repository = repository;
    }

    @Override
    protected void setId(ImportFile entity, Long id) {
        entity.setImportId(id);
    }

    @GetMapping("/user/{userId}")
    public List<ImportFile> getByUserId(@PathVariable Long userId) {
        return repository.findByUserId(userId);
    }
}
