package com.shuttershot.service;

import com.shuttershot.model.OtpVerification;
import com.shuttershot.repository.OtpVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * SMS delivery goes through Textbelt (textbelt.com). Its free tier (key
 * "textbelt") sends 1 real text/day per source IP at no cost — enough to
 * demonstrate genuine OTP delivery without a paid gateway. Bangladeshi
 * numbers only route correctly in E.164 form (+880...), so local input
 * formats (01XXXXXXXXX, 880..., bare 1XXXXXXXXX) are normalized before
 * sending. If the send fails (quota exhausted, provider error, contact is
 * an email rather than a phone, etc.) the code is logged instead so the
 * verification flow itself stays testable end-to-end.
 */
@Service
@RequiredArgsConstructor
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final int OTP_LENGTH = 6;
    private static final int EXPIRY_MINUTES = 5;
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final RestClient TEXTBELT_CLIENT = RestClient.create("https://textbelt.com");

    private final OtpVerificationRepository otpVerificationRepository;

    @Value("${textbelt.api-key}")
    private String textbeltApiKey;

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

        sendSms(contact, code);
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

    private void sendSms(String contact, String code) {
        String phone = normalizeBangladeshiPhone(contact);
        String message = "Your ShutterShot verification code is " + code
                + ". It expires in " + EXPIRY_MINUTES + " minutes.";

        if (phone == null) {
            log.info("OTP for {}: {} (expires in {} minutes) — not a phone number, nothing to text",
                    contact, code, EXPIRY_MINUTES);
            return;
        }

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("phone", phone);
        form.add("message", message);
        form.add("key", textbeltApiKey);

        try {
            Map<String, Object> response = TEXTBELT_CLIENT.post()
                    .uri("/text")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });

            if (response != null && Boolean.TRUE.equals(response.get("success"))) {
                log.info("OTP SMS sent to {} (quota remaining today: {})", phone, response.get("quotaRemaining"));
            } else {
                Object error = response != null ? response.get("error") : "no response body";
                log.warn("Textbelt could not deliver OTP to {} ({}) — code: {}", phone, error, code);
            }
        } catch (RestClientException ex) {
            log.warn("Textbelt request failed for {} — code: {}", phone, code, ex);
        }
    }

    /**
     * Bangladeshi mobile numbers only route reliably as E.164 (+880...).
     * Accepts the common local input shapes and returns null for anything
     * that isn't phone-shaped (e.g. an email contact).
     */
    private String normalizeBangladeshiPhone(String raw) {
        if (raw == null) {
            return null;
        }
        String digits = raw.replaceAll("[\\s-]", "");

        if (digits.startsWith("+880")) {
            return digits;
        }
        if (digits.startsWith("880") && digits.length() == 13) {
            return "+" + digits;
        }
        if (digits.startsWith("01") && digits.length() == 11) {
            return "+880" + digits.substring(1);
        }
        if (digits.matches("1\\d{9}")) {
            return "+880" + digits;
        }
        return null;
    }

    private String generateCode() {
        StringBuilder sb = new StringBuilder(OTP_LENGTH);
        for (int i = 0; i < OTP_LENGTH; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }
}
