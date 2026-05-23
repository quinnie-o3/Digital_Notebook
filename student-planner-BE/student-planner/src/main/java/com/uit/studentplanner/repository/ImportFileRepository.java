package com.uit.studentplanner.repository;

import com.uit.studentplanner.entity.ImportFile;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ImportFileRepository extends MongoRepository<ImportFile, Long> {

    List<ImportFile> findByUserId(Long userId);
}
