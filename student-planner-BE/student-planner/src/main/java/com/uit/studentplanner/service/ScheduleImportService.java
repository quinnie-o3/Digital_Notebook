package com.uit.studentplanner.service;

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
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ScheduleImportService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ScheduleImportService.class);

    private final TimetableRepository timetableRepository;
    private final SubjectRepository subjectRepository;
    private final ClassEntityRepository classRepository;
    private final ClassSessionRepository sessionRepository;
    private final LessonNoteRepository noteRepository;
    private final TaskRepository taskRepository;
    private final MongoTemplate mongoTemplate;

    public ScheduleImportService(
            TimetableRepository timetableRepository,
            SubjectRepository subjectRepository,
            ClassEntityRepository classRepository,
            ClassSessionRepository sessionRepository,
            LessonNoteRepository noteRepository,
            TaskRepository taskRepository,
            MongoTemplate mongoTemplate
    ) {
        this.timetableRepository = timetableRepository;
        this.subjectRepository = subjectRepository;
        this.classRepository = classRepository;
        this.sessionRepository = sessionRepository;
        this.noteRepository = noteRepository;
        this.taskRepository = taskRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public void importSchedule(ScheduleImportRequest request) {
        validate(request);
        Long userId = AuthContext.require().userId();
        boolean replace = "replace".equals(request.mode());

        PlannerSnapshot oldSnapshot = snapshot(userId);
        ImportChanges changes = new ImportChanges();

        try {
            Timetable target = replace
                    ? createTimetable(userId, changes)
                    : oldSnapshot.activeTimetableOrCreate(() -> createTimetable(userId, changes));

            for (ScheduleItemRequest item : request.subjects()) {
                createScheduleItem(userId, target, item, changes);
            }

        } catch (RuntimeException error) {
            cleanup(changes);
            throw error;
        }

        if (replace) {
            try {
                deleteSnapshot(oldSnapshot);
            } catch (RuntimeException cleanupError) {
                LOGGER.warn(
                        "New schedule was saved, but some previous schedule records could not be cleaned up",
                        cleanupError
                );
            }
        }
    }

    private void validate(ScheduleImportRequest request) {
        if (request == null || request.subjects() == null || request.subjects().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Schedule contains no classes");
        }
        if (!"append".equals(request.mode()) && !"replace".equals(request.mode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Import mode must be append or replace");
        }

        for (ScheduleItemRequest item : request.subjects()) {
            if (item == null || item.name() == null || item.name().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Every class requires a name");
            }
            if (item.day() == null || item.day() < 0 || item.day() > 6) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class day is invalid");
            }
            try {
                LocalTime start = LocalTime.parse(item.startTime());
                LocalTime end = LocalTime.parse(item.endTime());
                if (!end.isAfter(start)) {
                    throw new IllegalArgumentException();
                }
            } catch (RuntimeException error) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class time is invalid");
            }
        }
    }

    private Timetable createTimetable(Long userId, ImportChanges changes) {
        Timetable timetable = new Timetable();
        timetable.setUserId(userId);
        timetable.setName("My Timetable");
        timetable.setActive(1);
        timetable.setCreatedAt(LocalDateTime.now());
        timetable.setUpdatedAt(LocalDateTime.now());
        Timetable saved = timetableRepository.save(timetable);
        changes.timetables.add(saved);
        return saved;
    }

    private void createScheduleItem(
            Long userId,
            Timetable timetable,
            ScheduleItemRequest item,
            ImportChanges changes
    ) {
        LocalDateTime now = LocalDateTime.now();
        Subject subject = new Subject();
        subject.setUserId(userId);
        subject.setSubjectName(item.name().trim());
        subject.setSubjectCode(item.courseCode());
        subject.setColorCode(item.color());
        subject.setCreatedAt(now);
        subject.setUpdatedAt(now);
        subject = subjectRepository.save(subject);
        changes.subjects.add(subject);

        ClassEntity classEntity = new ClassEntity();
        classEntity.setUserId(userId);
        classEntity.setTimetableId(timetable.getTimetableId());
        classEntity.setSubjectId(subject.getSubjectId());
        classEntity.setDefaultRoom(item.room());
        classEntity.setCreatedType("import");
        classEntity.setCreatedAt(now);
        classEntity.setUpdatedAt(now);
        classEntity = classRepository.save(classEntity);
        changes.classes.add(classEntity);

        ClassSession session = new ClassSession();
        session.setUserId(userId);
        session.setClassId(classEntity.getClassId());
        session.setDayOfWeek(item.day() + 1);
        session.setStartTime(item.startTime());
        session.setEndTime(item.endTime());
        session.setRoom(item.room());
        session.setStartDate(item.startDate());
        session.setEndDate(item.endDate());
        session.setCreatedAt(now);
        session.setUpdatedAt(now);
        session = sessionRepository.save(session);
        changes.sessions.add(session);
    }

    private PlannerSnapshot snapshot(Long userId) {
        Query ownerQuery = Query.query(Criteria.where("user_id").is(userId));
        return new PlannerSnapshot(
                mongoTemplate.find(ownerQuery, Timetable.class),
                mongoTemplate.find(ownerQuery, Subject.class),
                mongoTemplate.find(ownerQuery, ClassEntity.class),
                mongoTemplate.find(ownerQuery, ClassSession.class),
                mongoTemplate.find(ownerQuery, LessonNote.class),
                mongoTemplate.find(ownerQuery, Task.class)
        );
    }

    private void deleteSnapshot(PlannerSnapshot snapshot) {
        taskRepository.deleteAll(snapshot.tasks());
        noteRepository.deleteAll(snapshot.notes());
        sessionRepository.deleteAll(snapshot.sessions());
        classRepository.deleteAll(snapshot.classes());
        subjectRepository.deleteAll(snapshot.subjects());
        timetableRepository.deleteAll(snapshot.timetables());
    }

    private void cleanup(ImportChanges changes) {
        taskRepository.deleteAll(changes.tasks);
        noteRepository.deleteAll(changes.notes);
        sessionRepository.deleteAll(changes.sessions);
        classRepository.deleteAll(changes.classes);
        subjectRepository.deleteAll(changes.subjects);
        timetableRepository.deleteAll(changes.timetables);
    }

    private static final class ImportChanges {
        private final List<Timetable> timetables = new ArrayList<>();
        private final List<Subject> subjects = new ArrayList<>();
        private final List<ClassEntity> classes = new ArrayList<>();
        private final List<ClassSession> sessions = new ArrayList<>();
        private final List<LessonNote> notes = new ArrayList<>();
        private final List<Task> tasks = new ArrayList<>();
    }

    private record PlannerSnapshot(
            List<Timetable> timetables,
            List<Subject> subjects,
            List<ClassEntity> classes,
            List<ClassSession> sessions,
            List<LessonNote> notes,
            List<Task> tasks
    ) {
        private Timetable activeTimetableOrCreate(java.util.function.Supplier<Timetable> factory) {
            return timetables.stream()
                    .filter(item -> Integer.valueOf(1).equals(item.getActive()))
                    .findFirst()
                    .or(() -> timetables.stream().findFirst())
                    .orElseGet(factory);
        }
    }
}
