package com.uit.studentplanner.controller;

import com.uit.studentplanner.config.AuthContext;
import com.uit.studentplanner.entity.AppUser;
import com.uit.studentplanner.repository.AppUserRepository;
import com.uit.studentplanner.service.PasswordService;
import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/app-users")
public class AppUserController {

    private final AppUserRepository repository;
    private final PasswordService passwordService;

    public AppUserController(AppUserRepository repository, PasswordService passwordService) {
        this.repository = repository;
        this.passwordService = passwordService;
    }

    @GetMapping("/me")
    public AppUserView getCurrentUser() {
        return toView(requireCurrentUser());
    }

    @PatchMapping("/me/password")
    public ResponseEntity<PasswordErrorResponse> updatePassword(@RequestBody PasswordPatchRequest request) {
        String currentPassword = request == null ? null : request.currentPassword();
        String newPassword = request == null ? null : request.newPassword();

        if (currentPassword == null || currentPassword.isBlank()) {
            return passwordError("currentPassword", "Current password is required.");
        }
        if (newPassword == null || newPassword.length() < 8) {
            return passwordError("newPassword", "Password must be at least 8 characters.");
        }

        AppUser user = requireCurrentUser();
        if (!passwordService.matches(currentPassword, user.getPasswordHash())) {
            return passwordError("currentPassword", "Current password is incorrect.");
        }
        if (passwordService.matches(newPassword, user.getPasswordHash())) {
            return passwordError("newPassword", "New password must be different from current password.");
        }

        user.setPasswordHash(passwordService.hash(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        repository.save(user);
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<PasswordErrorResponse> passwordError(String field, String message) {
        return ResponseEntity.badRequest().body(new PasswordErrorResponse(field, message));
    }

    private AppUser requireCurrentUser() {
        Long userId = AuthContext.require().userId();
        return repository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private AppUserView toView(AppUser user) {
        return new AppUserView(
                user.getUserId(),
                user.getEmail(),
                user.getUsername(),
                user.getRole(),
                user.getStatus()
        );
    }

    public record PasswordPatchRequest(String currentPassword, String newPassword) {
    }

    public record PasswordErrorResponse(String field, String message) {
    }

    public record AppUserView(
            Long userId,
            String email,
            String username,
            String role,
            String status
    ) {
    }
}
