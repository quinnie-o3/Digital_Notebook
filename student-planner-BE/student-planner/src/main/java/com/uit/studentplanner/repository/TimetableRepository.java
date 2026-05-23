package com.uit.studentplanner.repository;

import com.uit.studentplanner.entity.Timetable;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TimetableRepository extends MongoRepository<Timetable, Long> {

    List<Timetable> findByUserId(Long userId);
}
