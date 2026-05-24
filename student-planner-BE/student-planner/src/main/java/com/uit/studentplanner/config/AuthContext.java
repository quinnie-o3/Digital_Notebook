package com.uit.studentplanner.config;

import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class AuthContext {

    private static final ThreadLocal<Principal> CURRENT = new ThreadLocal<>();

    private AuthContext() {
    }

    public static void set(Principal principal) {
        CURRENT.set(principal);
    }

    public static Optional<Principal> get() {
        return Optional.ofNullable(CURRENT.get());
    }

    public static Principal require() {
        return get().orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    public static void clear() {
        CURRENT.remove();
    }

    public record Principal(Long userId, String username, String role) {
    }
}
