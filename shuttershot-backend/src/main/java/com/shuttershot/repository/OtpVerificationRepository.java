package com.shuttershot.repository;

import com.shuttershot.model.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findFirstByContactAndOtpCodeAndVerifiedFalseOrderByCreatedAtDesc(
            String contact, String otpCode);
}
