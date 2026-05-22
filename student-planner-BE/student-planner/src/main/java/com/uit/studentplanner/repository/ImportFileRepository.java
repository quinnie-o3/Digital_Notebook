package com.uit.studentplanner.repository;

import com.uit.studentplanner.entity.ImportFile;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ImportFileRepository extends JpaRepository<ImportFile, Long> {

    List<ImportFile> findByUserId(Long userId);
}
