package com.uit.studentplanner.repository;

import com.uit.studentplanner.entity.ClassEntity;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClassEntityRepository extends MongoRepository<ClassEntity, Long> {

    List<ClassEntity> findByTimetableId(Long timetableId);

    List<ClassEntity> findBySubjectId(Long subjectId);
}
