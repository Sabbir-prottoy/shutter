package com.shuttershot.controller;

import com.shuttershot.dto.OtpVerifyResponse;
import com.shuttershot.dto.SendOtpRequest;
import com.shuttershot.dto.VerifyOtpRequest;
import com.shuttershot.exception.InvalidRequestException;
import com.shuttershot.service.OtpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/otp")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;

    @PostMapping("/send")
    public ResponseEntity<Void> send(@Valid @RequestBody SendOtpRequest request) {
        otpService.sendOtp(request.getContact());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/verify")
    public ResponseEntity<OtpVerifyResponse> verify(@Valid @RequestBody VerifyOtpRequest request) {
        boolean verified = otpService.verifyOtp(request.getContact(), request.getOtpCode());
        if (!verified) {
            throw new InvalidRequestException("Invalid or expired OTP code");
        }
        return ResponseEntity.ok(new OtpVerifyResponse(true));
    }
}
