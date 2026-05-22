package com.uit.studentplanner.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI studentPlannerOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Digital Student Planner API")
                        .version("1.0.0")
                        .description("REST API for users, profiles, timetables, subjects, classes, sessions, notes, tasks, and imports."))
                .servers(List.of(new Server()
                        .url("http://localhost:8080")
                        .description("Local backend")));
    }
}
