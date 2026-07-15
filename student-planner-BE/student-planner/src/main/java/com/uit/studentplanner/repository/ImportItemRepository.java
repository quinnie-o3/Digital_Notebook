package com.uit.studentplanner.repository;

import com.uit.studentplanner.entity.ImportItem;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ImportItemRepository extends MongoRepository<ImportItem, Long> {

    List<ImportItem> findByImportIdAndUserId(Long importId, Long userId);
}
