package com.uit.studentplanner.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.uit.studentplanner.config.AuthContext;
import com.uit.studentplanner.entity.ClassEntity;
import com.uit.studentplanner.entity.Subject;
import com.uit.studentplanner.repository.ClassEntityRepository;
import com.uit.studentplanner.repository.SubjectRepository;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class OwnershipControllerTests {

    private static final Long CURRENT_USER_ID = 101L;

    @Mock
    private SubjectRepository subjectRepository;

    @Mock
    private ClassEntityRepository classRepository;

    @Mock
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void setCurrentUser() {
        AuthContext.set(new AuthContext.Principal(CURRENT_USER_ID, "student", "STUDENT"));
    }

    @AfterEach
    void clearCurrentUser() {
        AuthContext.clear();
    }

    @Test
    void listIsAlwaysScopedToCurrentUser() {
        SubjectController controller = new SubjectController(subjectRepository, mongoTemplate);
        when(mongoTemplate.find(any(Query.class), eq(Subject.class))).thenReturn(List.of());

        controller.getAll();

        ArgumentCaptor<Query> queryCaptor = ArgumentCaptor.forClass(Query.class);
        verify(mongoTemplate).find(queryCaptor.capture(), eq(Subject.class));
        assertEquals(CURRENT_USER_ID, queryCaptor.getValue().getQueryObject().get("user_id"));
    }

    @Test
    void createOverridesClientSuppliedOwner() {
        SubjectController controller = new SubjectController(subjectRepository, mongoTemplate);
        Subject subject = new Subject();
        subject.setUserId(999L);
        subject.setSubjectName("Secure course");
        when(subjectRepository.save(subject)).thenReturn(subject);

        Subject saved = controller.create(subject);

        assertSame(subject, saved);
        assertEquals(CURRENT_USER_ID, saved.getUserId());
    }

    @Test
    void resourceOwnedByAnotherUserIsReportedAsNotFound() {
        SubjectController controller = new SubjectController(subjectRepository, mongoTemplate);
        when(mongoTemplate.findOne(any(Query.class), eq(Subject.class))).thenReturn(null);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> controller.getById(55L)
        );

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    }

    @Test
    void foreignKeyOwnedByAnotherUserIsRejected() {
        ClassEntityController controller = new ClassEntityController(classRepository, mongoTemplate);
        ClassEntity classEntity = new ClassEntity();
        classEntity.setUserId(999L);
        classEntity.setTimetableId(200L);
        classEntity.setSubjectId(300L);
        when(mongoTemplate.exists(any(Query.class), any(Class.class))).thenReturn(false);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> controller.create(classEntity)
        );

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
        assertEquals(CURRENT_USER_ID, classEntity.getUserId());
    }
}
