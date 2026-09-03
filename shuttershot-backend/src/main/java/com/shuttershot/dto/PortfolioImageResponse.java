package com.shuttershot.dto;

import com.shuttershot.model.ImageCategory;
import com.shuttershot.model.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioImageResponse {

    private Long id;
    private Long photographerId;
    private String imageUrl;
    private ImageCategory category;
    private LocalDateTime uploadedAt;
    private VerificationStatus verificationStatus;
    private String flagReason;
}
