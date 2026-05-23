package com.uit.studentplanner.config;

import com.uit.studentplanner.entity.DatabaseSequence;
import java.lang.reflect.Field;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertEvent;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;
import org.springframework.util.ReflectionUtils;

@Component
public class MongoLongIdEventListener extends AbstractMongoEventListener<Object> {

    private final MongoOperations mongoOperations;

    public MongoLongIdEventListener(MongoOperations mongoOperations) {
        this.mongoOperations = mongoOperations;
    }

    @Override
    public void onBeforeConvert(BeforeConvertEvent<Object> event) {
        Object source = event.getSource();
        Field idField = findLongIdField(source.getClass());

        if (idField == null) {
            return;
        }

        ReflectionUtils.makeAccessible(idField);
        Object currentId = ReflectionUtils.getField(idField, source);

        if (currentId == null) {
            ReflectionUtils.setField(idField, source, getNextSequence(sequenceName(source.getClass())));
        }
    }

    private Field findLongIdField(Class<?> type) {
        Field[] idField = new Field[1];
        ReflectionUtils.doWithFields(type, field -> {
            if (field.isAnnotationPresent(Id.class) && Long.class.equals(field.getType())) {
                idField[0] = field;
            }
        });
        return idField[0];
    }

    private String sequenceName(Class<?> type) {
        Document document = type.getAnnotation(Document.class);
        if (document != null && !document.collection().isBlank()) {
            return document.collection();
        }
        return type.getSimpleName();
    }

    private Long getNextSequence(String sequenceName) {
        Query query = Query.query(Criteria.where("_id").is(sequenceName));
        Update update = new Update().inc("sequence", 1);
        FindAndModifyOptions options = FindAndModifyOptions.options().returnNew(true).upsert(true);

        DatabaseSequence sequence = mongoOperations.findAndModify(
                query,
                update,
                options,
                DatabaseSequence.class
        );

        if (sequence == null || sequence.getSequence() == null) {
            throw new IllegalStateException("Could not generate MongoDB sequence for " + sequenceName);
        }

        return sequence.getSequence();
    }
}
