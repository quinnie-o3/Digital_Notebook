package com.uit.studentplanner.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uit.studentplanner.config.AuthContext;
import com.uit.studentplanner.entity.AppUser;
import com.uit.studentplanner.entity.RefreshToken;
import com.uit.studentplanner.repository.AppUserRepository;
import com.uit.studentplanner.repository.RefreshTokenRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TokenService {

    private static final String ACCESS_TOKEN_TYPE = "access";
    private static final TypeReference<Map<String, Object>> CLAIMS_TYPE = new TypeReference<>() {
    };

    private final RefreshTokenRepository refreshTokenRepository;
    private final AppUserRepository appUserRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final SecureRandom secureRandom = new SecureRandom();
    private final byte[] tokenSecret;
    private final Duration accessTokenTtl;
    private final Duration refreshTokenTtl;

    public TokenService(
            RefreshTokenRepository refreshTokenRepository,
            AppUserRepository appUserRepository,
            @Value("${app.auth.token-secret}") String tokenSecret,
            @Value("${app.auth.access-token-minutes}") long accessTokenMinutes,
            @Value("${app.auth.refresh-token-days}") long refreshTokenDays
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.appUserRepository = appUserRepository;
        this.tokenSecret = tokenSecret.getBytes(StandardCharsets.UTF_8);
        this.accessTokenTtl = Duration.ofMinutes(accessTokenMinutes);
        this.refreshTokenTtl = Duration.ofDays(refreshTokenDays);
    }

    public TokenPair issueTokens(AppUser user, String deviceId) {
        Instant accessExpiresAt = Instant.now().plus(accessTokenTtl);
        LocalDateTime refreshExpiresAt = LocalDateTime.now().plus(refreshTokenTtl);
        String refreshTokenValue = createOpaqueToken();

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserId(user.getUserId());
        refreshToken.setTokenHash(hashToken(refreshTokenValue));
        refreshToken.setDeviceId(deviceId);
        refreshToken.setCreatedAt(LocalDateTime.now());
        refreshToken.setExpiresAt(refreshExpiresAt);
        refreshTokenRepository.save(refreshToken);

        return new TokenPair(
                createAccessToken(user, accessExpiresAt),
                refreshTokenValue,
                accessExpiresAt.getEpochSecond(),
                refreshExpiresAt
        );
    }

    public AuthSession refresh(String refreshTokenValue) {
        RefreshToken existingToken = refreshTokenRepository.findByTokenHash(hashToken(refreshTokenValue))
                .orElseThrow(this::unauthorized);

        if (existingToken.getRevokedAt() != null
                || existingToken.getExpiresAt() == null
                || existingToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw unauthorized();
        }

        AppUser user = appUserRepository.findById(existingToken.getUserId())
                .orElseThrow(this::unauthorized);

        existingToken.setRevokedAt(LocalDateTime.now());
        refreshTokenRepository.save(existingToken);

        return new AuthSession(user, issueTokens(user, existingToken.getDeviceId()));
    }

    public void revoke(String refreshTokenValue) {
        refreshTokenRepository.findByTokenHash(hashToken(refreshTokenValue)).ifPresent(refreshToken -> {
            refreshToken.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(refreshToken);
        });
    }

    public AuthContext.Principal validateAccessToken(String token) {
        String[] parts = token.split("\\.", -1);
        if (parts.length != 3) {
            throw unauthorized();
        }

        String signedContent = parts[0] + "." + parts[1];
        String expectedSignature = hmacSha256(signedContent);
        if (!MessageDigest.isEqual(
                expectedSignature.getBytes(StandardCharsets.UTF_8),
                parts[2].getBytes(StandardCharsets.UTF_8)
        )) {
            throw unauthorized();
        }

        try {
            byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
            Map<String, Object> claims = objectMapper.readValue(payloadBytes, CLAIMS_TYPE);

            if (!ACCESS_TOKEN_TYPE.equals(claims.get("type"))) {
                throw unauthorized();
            }

            Number expiresAt = (Number) claims.get("exp");
            if (expiresAt == null || Instant.now().getEpochSecond() >= expiresAt.longValue()) {
                throw unauthorized();
            }

            return new AuthContext.Principal(
                    Long.valueOf(String.valueOf(claims.get("sub"))),
                    stringClaim(claims.get("username")),
                    stringClaim(claims.get("role"))
            );
        } catch (ResponseStatusException error) {
            throw error;
        } catch (Exception error) {
            throw unauthorized();
        }
    }

    private String createAccessToken(AppUser user, Instant expiresAt) {
        try {
            Map<String, Object> header = new LinkedHashMap<>();
            header.put("alg", "HS256");
            header.put("typ", "JWT");

            Instant issuedAt = Instant.now();
            Map<String, Object> claims = new LinkedHashMap<>();
            claims.put("sub", String.valueOf(user.getUserId()));
            claims.put("username", user.getUsername());
            claims.put("role", user.getRole());
            claims.put("type", ACCESS_TOKEN_TYPE);
            claims.put("iat", issuedAt.getEpochSecond());
            claims.put("exp", expiresAt.getEpochSecond());

            String encodedHeader = base64Url(objectMapper.writeValueAsBytes(header));
            String encodedPayload = base64Url(objectMapper.writeValueAsBytes(claims));
            String signedContent = encodedHeader + "." + encodedPayload;

            return signedContent + "." + hmacSha256(signedContent);
        } catch (Exception error) {
            throw new IllegalStateException("Could not create access token", error);
        }
    }

    private String createOpaqueToken() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return base64Url(bytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return base64Url(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception error) {
            throw new IllegalStateException("Could not hash refresh token", error);
        }
    }

    private String hmacSha256(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(tokenSecret, "HmacSHA256"));
            return base64Url(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception error) {
            throw new IllegalStateException("Could not sign token", error);
        }
    }

    private String base64Url(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    private String stringClaim(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED);
    }

    public record TokenPair(
            String accessToken,
            String refreshToken,
            long accessTokenExpiresAt,
            LocalDateTime refreshTokenExpiresAt
    ) {
    }

    public record AuthSession(AppUser user, TokenPair tokenPair) {
    }
}
