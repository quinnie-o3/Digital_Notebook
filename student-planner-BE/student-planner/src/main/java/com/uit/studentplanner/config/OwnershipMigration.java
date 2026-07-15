package com.uit.studentplanner.config;

import static com.mongodb.client.model.Filters.eq;
import static com.mongodb.client.model.Filters.exists;
import static com.mongodb.client.model.Updates.set;

import com.mongodb.client.MongoCollection;
import java.util.concurrent.atomic.AtomicInteger;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

@Component
public class OwnershipMigration implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(OwnershipMigration.class);

    private final MongoTemplate mongoTemplate;
    private final boolean enabled;

    public OwnershipMigration(
            MongoTemplate mongoTemplate,
            @Value("${app.ownership-migration.enabled:true}") boolean enabled
    ) {
        this.mongoTemplate = mongoTemplate;
        this.enabled = enabled;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            return;
        }

        int migrated = 0;
        migrated += inheritOwner("classes", "timetables", "timetable_id");
        migrated += inheritOwner("classes", "subjects", "subject_id");
        migrated += inheritOwner("class_sessions", "classes", "class_id");
        migrated += inheritOwner("lesson_notes", "class_sessions", "session_id");
        migrated += inheritOwner("tasks", "class_sessions", "session_id");
        migrated += inheritOwner("tasks", "lesson_notes", "note_id");
        migrated += inheritOwner("import_items", "import_files", "import_id");

        if (migrated > 0) {
            LOGGER.info("Backfilled user_id for {} existing planner documents", migrated);
        }
    }

    private int inheritOwner(String childCollection, String parentCollection, String foreignKey) {
        MongoCollection<Document> children = mongoTemplate.getCollection(childCollection);
        MongoCollection<Document> parents = mongoTemplate.getCollection(parentCollection);
        AtomicInteger migrated = new AtomicInteger();

        for (Document child : children.find(exists("user_id", false))) {
            Object parentId = child.get(foreignKey);
            if (parentId == null) {
                continue;
            }

            Document parent = parents.find(eq("_id", parentId)).first();
            Object userId = parent == null ? null : parent.get("user_id");
            if (userId == null) {
                continue;
            }

            children.updateOne(eq("_id", child.get("_id")), set("user_id", userId));
            migrated.incrementAndGet();
        }

        return migrated.get();
    }
}
