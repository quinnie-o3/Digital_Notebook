package com.uit.studentplanner.repository;

import com.uit.studentplanner.entity.LessonNote;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LessonNoteRepository extends MongoRepository<LessonNote, Long> {

    List<LessonNote> findBySessionIdAndUserId(Long sessionId, Long userId);
}
