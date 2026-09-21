package com.shuttershot.service;

import com.shuttershot.exception.InvalidRequestException;
import com.shuttershot.model.PasswordResetToken;
import com.shuttershot.model.User;
import com.shuttershot.repository.PasswordResetTokenRepository;
import com.shuttershot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Password reset now happens by emailed OTP rather than an emailed link:
 * requestReset sends a 6-digit code (via OtpService, same channel as booking
 * email verification), verifyResetOtp checks it and — only once it's right —
 * mints a short-lived PasswordResetToken, and resetPassword spends that token
 * exactly as it always has. The token is never emailed or shown in a URL; it
 * only ever exists in the verify-otp response, held in memory by the frontend
 * for the few seconds between verifying the code and setting a new password.
 */
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final int RESET_TOKEN_EXPIRY_MINUTES = 30;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;

    @Transactional
    public void requestReset(String email) {
        // Always behave the same whether or not the email is registered, and
        // never let a send failure escape as a different response — otherwise
        // this endpoint becomes a way to enumerate accounts.
        userRepository.findByEmail(email).ifPresent(user -> {
            try {
                otpService.sendOtpEmail(email);
            } catch (MailException ex) {
                log.warn("Could not send password reset OTP to {}", email, ex);
            }
        });
    }

    @Transactional
    public String verifyResetOtp(String email, String otpCode) {
        User user = userRepository.findByEmail(email)
                .filter(u -> otpService.verifyOtp(email, otpCode))
                .orElseThrow(() -> new InvalidRequestException("Invalid or expired code"));

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(RESET_TOKEN_EXPIRY_MINUTES))
                .build();
        passwordResetTokenRepository.save(resetToken);
        return token;
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .filter(t -> !t.isUsed())
                .filter(t -> t.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new InvalidRequestException("This reset session is invalid or has expired"));

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        // Keeps the main admin's staff list and photographer history in sync
        // with whatever password the account holder is actually using —
        // null only for accounts that never had a stored value to begin with.
        user.setStoredPassword(newPassword);
        resetToken.setUsed(true);
    }
}
