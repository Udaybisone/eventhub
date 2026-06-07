package com.eventhub.auth;

import com.eventhub.auth.dto.AuthDtos.*;
import com.eventhub.common.Sha256;
import com.eventhub.email.EmailClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

import static org.springframework.http.HttpStatus.*;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordResetTokenRepository resetTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailClient emailClient;
    private final Duration refreshTtl;
    private final Duration resetTtl;
    private final String frontendBaseUrl;

    public AuthService(UserRepository users,
                       RefreshTokenRepository refreshTokens,
                       PasswordResetTokenRepository resetTokens,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       EmailClient emailClient,
                       @Value("${app.jwt.refresh-token-ttl}") Duration refreshTtl,
                       @Value("${app.auth.password-reset-ttl}") Duration resetTtl,
                       @Value("${app.frontend.base-url}") String frontendBaseUrl) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.resetTokens = resetTokens;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailClient = emailClient;
        this.refreshTtl = refreshTtl;
        this.resetTtl = resetTtl;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmail(email)) {
            throw new ResponseStatusException(CONFLICT, "Email already registered");
        }
        User user = users.save(new User(email, passwordEncoder.encode(req.password()), Role.USER));
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        User user = users.findByEmail(email)
                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid credentials"));
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest req) {
        String hash = Sha256.hex(req.refreshToken());
        Instant now = Instant.now();
        RefreshToken stored = refreshTokens.findByTokenHash(hash)
                .filter(t -> t.isActive(now))
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid refresh token"));
        // Rotate: revoke the presented token and issue a fresh pair.
        stored.setRevoked(true);
        User user = users.findById(stored.getUserId())
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid refresh token"));
        return issueTokens(user);
    }

    @Transactional
    public void logout(LogoutRequest req) {
        refreshTokens.findByTokenHash(Sha256.hex(req.refreshToken()))
                .ifPresent(t -> t.setRevoked(true));
    }

    /** Always succeeds from the caller's view, to avoid leaking which emails exist. */
    @Transactional
    public void requestPasswordReset(PasswordResetRequest req) {
        String email = req.email().trim().toLowerCase();
        users.findByEmail(email).ifPresent(user -> {
            String token = randomToken();
            resetTokens.save(new PasswordResetToken(
                    user.getId(), Sha256.hex(token), Instant.now().plus(resetTtl)));
            String link = frontendBaseUrl + "/reset-password?token=" + token;
            emailClient.send(user.getEmail(), "Reset your EventHub password",
                    "Reset your password using this link: " + link);
        });
    }

    @Transactional
    public void confirmPasswordReset(PasswordResetConfirm req) {
        Instant now = Instant.now();
        PasswordResetToken token = resetTokens.findByTokenHash(Sha256.hex(req.token()))
                .filter(t -> t.isUsable(now))
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Invalid or expired token"));
        User user = users.findById(token.getUserId())
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Invalid token"));
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        token.setUsed(true);
        // Invalidate existing sessions after a password change is best practice;
        // refresh tokens for this user are left for a future enhancement.
        log.info("Password reset completed for user {}", user.getId());
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshPlaintext = randomToken();
        refreshTokens.save(new RefreshToken(
                user.getId(), Sha256.hex(refreshPlaintext), Instant.now().plus(refreshTtl)));
        return new AuthResponse(
                accessToken,
                refreshPlaintext,
                jwtService.accessTtlSeconds(),
                user.getEmail(),
                user.getRole().name());
    }

    private static String randomToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
