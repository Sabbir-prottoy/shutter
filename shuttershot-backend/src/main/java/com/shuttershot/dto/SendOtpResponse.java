package com.shuttershot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * devOtpCode is a temporary stand-in for real SMS delivery (see OtpService's
 * class docs) — surfaced here so the frontend can show it directly rather
 * than the flow being blocked on an unsolved SMS gateway.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendOtpResponse {

    private String devOtpCode;
}
