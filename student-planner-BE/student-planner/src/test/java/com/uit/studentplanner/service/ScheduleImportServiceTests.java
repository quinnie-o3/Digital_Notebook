package com.uit.studentplanner.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.uit.studentplanner.config.AuthContext;
import com.uit.studentplanner.controller.PlannerImportController.ScheduleImportRequest;
import com.uit.studentplanner.controller.PlannerImportController.ScheduleItemRequest;
import com.uit.studentplanner.entity.ClassEntity;
import com.uit.studentplanner.entity.ClassSession;
import com.uit.studentplanner.entity.LessonNote;
import com.uit.studentplanner.entity.Subject;
import com.uit.studentplanner.entity.Task;
import com.uit.studentplanner.entity.Timetable;
import com.uit.studentplanner.repository.ClassEntityRepository;
import com.uit.studentplanner.repository.ClassSessionRepository;
import com.uit.studentplanner.repository.LessonNoteRepository;
import com.uit.studentplanner.repository.SubjectRepository;
import com.uit.studentplanner.repository.TaskRepository;
import com.uit.studentplanner.repository.TimetableRepository;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

@ExtendWith(MockitoExtension.class)
class ScheduleImportServiceTests {

    @Mock private TimetableRepository timetableRepository;
    @Mock private SubjectRepository subjectRepository;
    @Mock private ClassEntityRepository classRepository;
    @Mock private ClassSessionRepository sessionRepository;
    @Mock private LessonNoteRepository noteRepository;
    @Mock private TaskRepository taskRepository;
    @Mock private MongoTemplate mongoTemplate;

    private ScheduleImportService service;

    @BeforeEach
    void setUp() {
        AuthContext.set(new AuthContext.Principal(10L, "student", "STUDENT"));
        service = new ScheduleImportService(
                timetableRepository,
                subjectRepository,
                classRepository,
                sessionRepository,
                noteRepository,
                taskRepository,
                mongoTemplate
        );
    }

    @AfterEach
    void clearContext() {
        AuthContext.clear();
    }

    @Test
    void failedReplaceCleansStagingAndKeepsOldSchedule() {
        Timetable oldTimetable = new Timetable();
        oldTimetable.setTimetableId(1L);
        oldTimetable.setUserId(10L);
        Subject oldSubject = new Subject();
        oldSubject.setSubjectId(2L);
        oldSubject.setUserId(10L);

        when(mongoTemplate.find(any(Query.class), eq(Timetable.class))).thenReturn(List.of(oldTimetable));
        when(mongoTemplate.find(any(Query.class), eq(Subject.class))).thenReturn(List.of(oldSubject));
        when(mongoTemplate.find(any(Query.class), eq(ClassEntity.class))).thenReturn(List.of());
        when(mongoTemplate.find(any(Query.class), eq(ClassSession.class))).thenReturn(List.of());
        when(mongoTemplate.find(any(Query.class), eq(LessonNote.class))).thenReturn(List.of());
        when(mongoTemplate.find(any(Query.class), eq(Task.class))).thenReturn(List.of());

        when(timetableRepository.save(any(Timetable.class))).thenAnswer(invocation -> {
            Timetable timetable = invocation.getArgument(0);
            timetable.setTimetableId(100L);
            return timetable;
        });
        when(subjectRepository.save(any(Subject.class))).thenAnswer(invocation -> {
            Subject subject = invocation.getArgument(0);
            subject.setSubjectId(200L);
            return subject;
        });
        when(classRepository.save(any(ClassEntity.class)))
                .thenThrow(new IllegalStateException("simulated database failure"));

        ScheduleImportRequest request = new ScheduleImportRequest(
                "replace",
                List.of(new ScheduleItemRequest(
                        "New course", "NEW01", "#ffffff", 1,
                        "08:00", "09:00", "A1", null, null
                ))
        );

        assertThrows(IllegalStateException.class, () -> service.importSchedule(request));

        verify(timetableRepository, never()).deleteAll(List.of(oldTimetable));
        verify(subjectRepository, never()).deleteAll(List.of(oldSubject));
        verify(timetableRepository).deleteAll(any(List.class));
        verify(subjectRepository).deleteAll(any(List.class));
    }
}
