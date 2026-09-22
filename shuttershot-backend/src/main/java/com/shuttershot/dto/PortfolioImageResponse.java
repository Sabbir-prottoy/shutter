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
    private String caption;
    private LocalDateTime uploadedAt;
    private VerificationStatus verificationStatus;
    private String flagReason;

    // Photographer-facing explanation, set whenever a photo is rejected.
    private String rejectionReason;

    // Detectra v3's automatic screening at upload time.
    private String detectraVerdict;
    private Double detectraConfidence;
    private LocalDateTime detectraCheckedAt;

    // Null until an admin runs the deep AI check (PortfolioService.checkForAi).
    private String aiCheckVerdict;
    private Double aiCheckConfidence;
    private String aiCheckGenerator;
    private LocalDateTime aiCheckedAt;
}
