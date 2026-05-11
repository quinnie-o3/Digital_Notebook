package com.uit.studentplanner.repository;

import com.uit.studentplanner.entity.Note;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByCourseId(Long courseId);
}
