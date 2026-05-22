package com.uit.studentplanner.repository;

import com.uit.studentplanner.entity.ClassSession;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClassSessionRepository extends JpaRepository<ClassSession, Long> {

    List<ClassSession> findByClassId(Long classId);
}
