package com.shuttershot.controller;

import com.shuttershot.dto.AuthResponse;
import com.shuttershot.dto.ForgotPasswordRequest;
import com.shuttershot.dto.LoginRequest;
import com.shuttershot.dto.RegisterRequest;
import com.shuttershot.dto.ResetPasswordRequest;
import com.shuttershot.dto.ResetTokenResponse;
import com.shuttershot.dto.VerifyResetOtpRequest;
import com.shuttershot.service.AuthService;
import com.shuttershot.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/register-customer")
    public ResponseEntity<AuthResponse> registerCustomer(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerCustomer(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestReset(request.getEmail());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/verify-reset-otp")
    public ResponseEntity<ResetTokenResponse> verifyResetOtp(@Valid @RequestBody VerifyResetOtpRequest request) {
        String token = passwordResetService.verifyResetOtp(request.getEmail(), request.getOtpCode());
        return ResponseEntity.ok(ResetTokenResponse.builder().resetToken(token).build());
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.noContent().build();
    }
}
