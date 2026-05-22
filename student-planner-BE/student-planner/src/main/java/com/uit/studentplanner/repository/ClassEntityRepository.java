package com.uit.studentplanner.repository;

import com.uit.studentplanner.entity.ClassEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClassEntityRepository extends JpaRepository<ClassEntity, Long> {

    List<ClassEntity> findByTimetableId(Long timetableId);

    List<ClassEntity> findBySubjectId(Long subjectId);
}
