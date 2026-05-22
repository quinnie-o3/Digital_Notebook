package com.uit.studentplanner.repository;

import com.uit.studentplanner.entity.ImportItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ImportItemRepository extends JpaRepository<ImportItem, Long> {

    List<ImportItem> findByImportId(Long importId);
}
