package com.uit.studentplanner.repository;

import com.uit.studentplanner.entity.Task;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findBySessionId(Long sessionId);

    List<Task> findByNoteId(Long noteId);
}
