package com.uit.studentplanner.repository;

import com.uit.studentplanner.entity.ClassSession;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClassSessionRepository extends MongoRepository<ClassSession, Long> {

    List<ClassSession> findByClassId(Long classId);
}
