package com.uit.studentplanner.repository;

import com.uit.studentplanner.entity.Subject;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubjectRepository extends MongoRepository<Subject, Long> {

    List<Subject> findByUserId(Long userId);
}
