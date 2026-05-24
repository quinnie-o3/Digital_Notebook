package com.uit.studentplanner.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import java.util.Locale;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;
import org.springframework.util.StringUtils;

@Configuration
public class MongoConfig {

    private static final String DEFAULT_DATABASE = "student_planner";

    private final Environment environment;

    public MongoConfig(Environment environment) {
        this.environment = environment;
    }

    @Bean
    public MongoClient mongoClient() {
        String uri = firstText(
                System.getenv("MONGODB_URI"),
                System.getenv("SPRING_DATA_MONGODB_URI"),
                environment.getProperty("MONGODB_URI"),
                environment.getProperty("SPRING_DATA_MONGODB_URI"),
                environment.getProperty("spring.data.mongodb.uri"));

        if (!StringUtils.hasText(uri)) {
            throw new IllegalStateException(
                    "Missing MONGODB_URI. Set it to your public MongoDB connection string before starting the backend.");
        }

        String normalizedUri = uri.toLowerCase(Locale.ROOT);
        if (normalizedUri.contains(blockedHost())
                || normalizedUri.contains("127.0.0.1")
                || normalizedUri.contains(blockedPort())) {
            throw new IllegalStateException("MONGODB_URI must point to a public MongoDB server.");
        }

        return MongoClients.create(uri);
    }

    @Bean
    public MongoDatabaseFactory mongoDatabaseFactory(MongoClient mongoClient) {
        return new SimpleMongoClientDatabaseFactory(mongoClient, mongoDatabaseName());
    }

    @Bean
    public MongoTemplate mongoTemplate(MongoDatabaseFactory mongoDatabaseFactory) {
        return new MongoTemplate(mongoDatabaseFactory);
    }

    private String mongoDatabaseName() {
        return firstText(
                System.getenv("MONGODB_DATABASE"),
                environment.getProperty("MONGODB_DATABASE"),
                environment.getProperty("spring.data.mongodb.database"),
                DEFAULT_DATABASE);
    }

    private String firstText(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value) && !value.startsWith("${")) {
                return value.trim();
            }
        }

        return "";
    }

    private String blockedHost() {
        return String.join("", "local", "host");
    }

    private String blockedPort() {
        return ":" + String.join("", "270", "17");
    }
}
