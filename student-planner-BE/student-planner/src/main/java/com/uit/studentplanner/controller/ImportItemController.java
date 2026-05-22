package com.uit.studentplanner.controller;

import com.uit.studentplanner.entity.ImportItem;
import com.uit.studentplanner.repository.ImportItemRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/import-items")
public class ImportItemController extends CrudController<ImportItem> {

    private final ImportItemRepository repository;

    public ImportItemController(ImportItemRepository repository) {
        super(repository);
        this.repository = repository;
    }

    @Override
    protected void setId(ImportItem entity, Long id) {
        entity.setItemId(id);
    }

    @GetMapping("/import/{importId}")
    public List<ImportItem> getByImportId(@PathVariable Long importId) {
        return repository.findByImportId(importId);
    }
}
