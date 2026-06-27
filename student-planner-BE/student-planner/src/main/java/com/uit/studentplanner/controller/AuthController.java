package com.uit.studentplanner.controller;

import com.uit.studentplanner.config.AuthContext;
import com.uit.studentplanner.entity.AppUser;
import com.uit.studentplanner.repository.AppUserRepository;
import com.uit.studentplanner.service.PasswordService;
import com.uit.studentplanner.service.TokenService;
import com.uit.studentplanner.service.TokenService.AuthSession;
import com.uit.studentplanner.service.TokenService.TokenPair;
import java.time.LocalDateTime;
import java.util.Locale;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AppUserRepository appUserRepository;
    private final PasswordService passwordService;
    private final TokenService tokenService;

    public AuthController(
            AppUserRepository appUserRepository,
            PasswordService passwordService,
            TokenService tokenService
    ) {
        this.appUserRepository = appUserRepository;
        this.passwordService = passwordService;
        this.tokenService = tokenService;
    }

    @PostMapping("/register")
    public AuthResponse register(@RequestBody EmailAuthRequest request) {
        String email = normalizeEmail(request == null ? null : request.email());
        String password = validatePassword(request == null ? null : request.password());

        AppUser user = new AppUser();
        LocalDateTime now = LocalDateTime.now();
        user.setEmail(email);
        user.setUsername(email);
        user.setPasswordHash(passwordService.hash(password));
        user.setRole("STUDENT");
        user.setStatus("ACTIVE");
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        try {
            AppUser savedUser = appUserRepository.save(user);
            return toResponse(savedUser, tokenService.issueTokens(savedUser, email));
        } catch (DuplicateKeyException error) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody EmailAuthRequest request) {
        String email = normalizeEmail(request == null ? null : request.email());
        String password = request == null ? null : request.password();
        AppUser user = appUserRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        if (!passwordService.matches(password, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        return toResponse(user, tokenService.issueTokens(user, email));
    }

    @PostMapping("/device-session")
    public AuthResponse createDeviceSession(@RequestBody DeviceSessionRequest request) {
        String deviceId = normalizeDeviceId(request == null ? null : request.deviceId());
        String username = "device_" + deviceId;
        AppUser user = findOrCreateDeviceUser(username);

        return toResponse(user, tokenService.issueTokens(user, deviceId));
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@RequestBody RefreshTokenRequest request) {
        String refreshToken = request == null ? null : request.refreshToken();
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refresh token is required");
        }

        AuthSession authSession = tokenService.refresh(refreshToken);
        return toResponse(authSession.user(), authSession.tokenPair());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestBody(required = false) RefreshTokenRequest request) {
        String refreshToken = request == null ? null : request.refreshToken();
        if (refreshToken != null && !refreshToken.isBlank()) {
            tokenService.revoke(refreshToken);
        }
    }

    @GetMapping("/me")
    public AuthUser me() {
        AuthContext.Principal principal = AuthContext.require();
        AppUser user = appUserRepository.findById(principal.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        return toAuthUser(user);
    }

    private AppUser createDeviceUser(String username) {
        LocalDateTime now = LocalDateTime.now();
        AppUser user = new AppUser();
        user.setEmail(username + "@student-planner.local");
        user.setUsername(username);
        user.setPasswordHash("device-session");
        user.setRole("STUDENT");
        user.setStatus("ACTIVE");
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        return appUserRepository.save(user);
    }

    private AppUser findOrCreateDeviceUser(String username) {
        return appUserRepository.findByUsername(username).orElseGet(() -> {
            try {
                return createDeviceUser(username);
            } catch (DuplicateKeyException error) {
                return appUserRepository.findByUsername(username)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT));
            }
        });
    }

    private AuthResponse toResponse(AppUser user, TokenPair tokenPair) {
        return new AuthResponse(
                tokenPair.accessToken(),
                tokenPair.refreshToken(),
                tokenPair.accessTokenExpiresAt(),
                tokenPair.refreshTokenExpiresAt().toString(),
                toAuthUser(user)
        );
    }

    private AuthUser toAuthUser(AppUser user) {
        return new AuthUser(
                user.getUserId(),
                user.getEmail(),
                user.getUsername(),
                user.getRole(),
                user.getStatus()
        );
    }

    private String normalizeDeviceId(String rawDeviceId) {
        if (rawDeviceId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Device id is required");
        }

        String deviceId = rawDeviceId.replaceAll("[^a-zA-Z0-9]", "");
        if (deviceId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Device id is required");
        }

        return deviceId.length() > 64 ? deviceId.substring(0, 64) : deviceId;
    }

    private String normalizeEmail(String rawEmail) {
        if (rawEmail == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        String email = rawEmail.trim().toLowerCase(Locale.ROOT);
        if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid email");
        }

        return email;
    }

    private String validatePassword(String password) {
        if (password == null || password.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
        }

        return password;
    }

    public record DeviceSessionRequest(String deviceId) {
    }

    public record EmailAuthRequest(String email, String password) {
    }

    public record RefreshTokenRequest(String refreshToken) {
    }

    public record AuthResponse(
            String accessToken,
            String refreshToken,
            long accessTokenExpiresAt,
            String refreshTokenExpiresAt,
            AuthUser user
    ) {
    }

    public record AuthUser(
            Long userId,
            String email,
            String username,
            String role,
            String status
    ) {
    }
}
