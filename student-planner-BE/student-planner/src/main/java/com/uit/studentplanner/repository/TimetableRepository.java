package com.uit.studentplanner.repository;

import com.uit.studentplanner.entity.Timetable;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TimetableRepository extends JpaRepository<Timetable, Long> {

    List<Timetable> findByUserId(Long userId);
}
