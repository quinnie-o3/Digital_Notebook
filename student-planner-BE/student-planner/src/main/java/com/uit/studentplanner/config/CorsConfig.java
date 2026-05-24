package com.uit.studentplanner.config;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    private static final String DEFAULT_FRONTEND_ORIGIN = "https://digital-notebook-rho.vercel.app";

    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilter() {
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

        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(originList);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);

        FilterRegistrationBean<CorsFilter> registration = new FilterRegistrationBean<>(new CorsFilter(source));
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }
}
