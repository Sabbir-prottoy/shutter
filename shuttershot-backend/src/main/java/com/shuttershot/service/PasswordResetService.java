package com.shuttershot.service;

import com.shuttershot.exception.InvalidRequestException;
import com.shuttershot.model.PasswordResetToken;
import com.shuttershot.model.User;
import com.shuttershot.repository.PasswordResetTokenRepository;
import com.shuttershot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Reset links are emailed via Spring Mail. Local dev won't have real SMTP
 * credentials configured (see SETUP.md) — rather than fail the request, a
 * send failure is logged with the link itself so the flow is still testable
 * end-to-end without a mail account, same fallback philosophy as OtpService.
 */
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final int EXPIRY_MINUTES = 30;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.mail-from}")
    private String mailFrom;

    @Transactional
    public void requestReset(String email) {
        // Always behave the same whether or not the email is registered —
        // otherwise this endpoint becomes a way to enumerate accounts.
        userRepository.findByEmail(email).ifPresent(this::issueTokenAndSendEmail);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .filter(t -> !t.isUsed())
                .filter(t -> t.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new InvalidRequestException("This reset link is invalid or has expired"));

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        resetToken.setUsed(true);
    }

    private void issueTokenAndSendEmail(User user) {
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(EXPIRY_MINUTES))
                .build();
        passwordResetTokenRepository.save(resetToken);

        String link = frontendUrl + "/reset-password?token=" + token;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(user.getEmail());
            message.setSubject("Reset your ShutterShot password");
            message.setText(
                    "Hi " + user.getName() + ",\n\n"
                            + "We received a request to reset your ShutterShot password. "
                            + "Click the link below to choose a new one — it expires in "
                            + EXPIRY_MINUTES + " minutes:\n\n"
                            + link + "\n\n"
                            + "If you didn't request this, you can safely ignore this email."
            );
            mailSender.send(message);
        } catch (MailException ex) {
            log.warn("Could not send password reset email to {} (is MAIL_USERNAME/MAIL_PASSWORD configured?) "
                    + "— reset link: {}", user.getEmail(), link, ex);
        }
    }
}
