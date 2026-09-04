package com.shuttershot.service;

import com.shuttershot.model.OtpVerification;
import com.shuttershot.repository.OtpVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * No SMS/email provider is wired up yet (that integration is out of MVP scope
 * per section 9 of the project doc). For now the generated code is written to
 * the application log only, never returned in an API response — this mirrors
 * how a real provider would behave (fire-and-forget) rather than baking in a
 * shortcut that would need to be ripped out later.
 */
@Service
@RequiredArgsConstructor
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final int OTP_LENGTH = 6;
    private static final int EXPIRY_MINUTES = 5;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpVerificationRepository otpVerificationRepository;

    @Transactional
    public void sendOtp(String contact) {
        String code = generateCode();

        OtpVerification otp = OtpVerification.builder()
                .contact(contact)
                .otpCode(code)
                .expiresAt(LocalDateTime.now().plusMinutes(EXPIRY_MINUTES))
                .verified(false)
                .build();
        otpVerificationRepository.save(otp);

        log.info("OTP for {}: {} (expires in {} minutes)", contact, code, EXPIRY_MINUTES);
    }

    @Transactional
    public boolean verifyOtp(String contact, String code) {
        return otpVerificationRepository
                .findFirstByContactAndOtpCodeAndVerifiedFalseOrderByCreatedAtDesc(contact, code)
                .filter(otp -> otp.getExpiresAt().isAfter(LocalDateTime.now()))
                .map(otp -> {
                    otp.setVerified(true);
                    return true;
                })
                .orElse(false);
    }

    private String generateCode() {
        StringBuilder sb = new StringBuilder(OTP_LENGTH);
        for (int i = 0; i < OTP_LENGTH; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }
}
