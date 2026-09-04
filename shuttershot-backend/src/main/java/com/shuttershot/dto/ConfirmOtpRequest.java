package com.shuttershot.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmOtpRequest {

    @NotBlank(message = "OTP code is required")
    private String otpCode;
}
