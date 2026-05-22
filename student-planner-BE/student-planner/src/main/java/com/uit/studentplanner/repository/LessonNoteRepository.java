package com.uit.studentplanner.repository;

import com.uit.studentplanner.entity.LessonNote;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LessonNoteRepository extends JpaRepository<LessonNote, Long> {

    List<LessonNote> findBySessionId(Long sessionId);
}
