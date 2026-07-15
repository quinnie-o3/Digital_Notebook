package com.uit.studentplanner.controller;

import com.uit.studentplanner.entity.ImportItem;
import com.uit.studentplanner.entity.ImportFile;
import com.uit.studentplanner.repository.ImportItemRepository;
import java.util.List;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/import-items")
public class ImportItemController extends CrudController<ImportItem> {

    private final ImportItemRepository repository;

    public ImportItemController(ImportItemRepository repository, MongoTemplate mongoTemplate) {
        super(repository, mongoTemplate, ImportItem.class);
        this.repository = repository;
    }

    @Override
    protected void setId(ImportItem entity, Long id) {
        entity.setItemId(id);
    }

    @Override
    protected void validateReferences(ImportItem entity, Long userId) {
        requireOwnedResource(ImportFile.class, entity.getImportId(), userId);
    }

    @GetMapping("/import/{importId}")
    public List<ImportItem> getByImportId(@PathVariable Long importId) {
        Long userId = currentUserId();
        requireOwnedResource(ImportFile.class, importId, userId);
        return repository.findByImportIdAndUserId(importId, userId);
    }
}
