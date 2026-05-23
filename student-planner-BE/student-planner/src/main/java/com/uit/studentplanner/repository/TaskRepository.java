package com.uit.studentplanner.repository;

import com.uit.studentplanner.entity.Task;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskRepository extends MongoRepository<Task, Long> {

    List<Task> findBySessionId(Long sessionId);

    List<Task> findByNoteId(Long noteId);
}
