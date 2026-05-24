package com.uit.studentplanner.config;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    private static final String DEFAULT_FRONTEND_ORIGIN = "https://digital-notebook-rho.vercel.app";

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        String configuredOrigins = System.getenv().getOrDefault(
                "FRONTEND_ORIGINS",
                ""
        );
        Set<String> allowedOrigins = new LinkedHashSet<>();
        allowedOrigins.add(DEFAULT_FRONTEND_ORIGIN);
        allowedOrigins.addAll(Arrays.stream(configuredOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList());
        List<String> originList = allowedOrigins.stream().toList();

        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins(originList.toArray(String[]::new))
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .maxAge(3600);
            }
        };
    }
}
