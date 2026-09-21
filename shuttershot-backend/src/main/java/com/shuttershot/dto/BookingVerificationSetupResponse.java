package com.shuttershot.dto;

import com.shuttershot.model.BookingVerificationMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingVerificationSetupResponse {

    private BookingVerificationMethod method;
    private String instructions;

    // PHONE_OTP / EMAIL_OTP only — see OtpService's class docs on why this is
    // surfaced directly instead of only ever being delivered out of band.
    private String devOtpCode;

    // TOTP only.
    private String totpSecret;
    private String totpQrDataUri;
}
