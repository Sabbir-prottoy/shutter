package com.shuttershot.service;

import com.shuttershot.dto.PortfolioImageResponse;
import com.shuttershot.exception.InvalidRequestException;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.ImageCategory;
import com.shuttershot.model.PhotographerProfile;
import com.shuttershot.model.PortfolioImage;
import com.shuttershot.model.VerificationStatus;
import com.shuttershot.repository.PhotographerProfileRepository;
import com.shuttershot.repository.PortfolioImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final PortfolioImageRepository portfolioImageRepository;
    private final PhotographerProfileRepository photographerProfileRepository;
    private final ImageVerificationService imageVerificationService;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public List<PortfolioImageResponse> listByPhotographer(Long photographerId) {
        return portfolioImageRepository.findByPhotographerId(photographerId).stream()
                .filter(image -> image.getVerificationStatus() != VerificationStatus.FLAGGED)
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PortfolioImageResponse upload(MultipartFile file, ImageCategory category, Long authenticatedUserId) {
        PhotographerProfile photographer = findOwnProfile(authenticatedUserId);

        ImageVerificationService.VerificationResult result = imageVerificationService.verify(file);
        String imageUrl = fileStorageService.store(file);

        PortfolioImage image = PortfolioImage.builder()
                .photographer(photographer)
                .imageUrl(imageUrl)
                .category(category)
                .exifData(result.exifDataJson())
                .verificationStatus(result.status())
                .flagReason(result.flagReason())
                .build();

        return toResponse(portfolioImageRepository.save(image));
    }

    @Transactional
    public void delete(Long imageId, Long authenticatedUserId) {
        PortfolioImage image = findById(imageId);
        PhotographerProfile owner = findOwnProfile(authenticatedUserId);

        if (!image.getPhotographer().getId().equals(owner.getId())) {
            throw new AccessDeniedException("You can only delete your own portfolio images");
        }

        fileStorageService.delete(image.getImageUrl());
        portfolioImageRepository.delete(image);
    }

    @Transactional(readOnly = true)
    public List<PortfolioImageResponse> listFlagged() {
        return portfolioImageRepository.findByVerificationStatus(VerificationStatus.FLAGGED).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PortfolioImageResponse verifyByAdmin(Long imageId) {
        PortfolioImage image = findById(imageId);
        if (image.getVerificationStatus() != VerificationStatus.FLAGGED) {
            throw new InvalidRequestException("Only flagged photos can be moderated");
        }

        image.setVerificationStatus(VerificationStatus.VERIFIED);
        image.setFlagReason(null);
        return toResponse(image);
    }

    @Transactional
    public void rejectByAdmin(Long imageId) {
        PortfolioImage image = findById(imageId);
        if (image.getVerificationStatus() != VerificationStatus.FLAGGED) {
            throw new InvalidRequestException("Only flagged photos can be moderated");
        }

        fileStorageService.delete(image.getImageUrl());
        portfolioImageRepository.delete(image);
    }

    private PortfolioImage findById(Long id) {
        return portfolioImageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio image not found with id: " + id));
    }

    private PhotographerProfile findOwnProfile(Long authenticatedUserId) {
        return photographerProfileRepository.findByUserId(authenticatedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Photographer profile not found for current user"));
    }

    private PortfolioImageResponse toResponse(PortfolioImage image) {
        return PortfolioImageResponse.builder()
                .id(image.getId())
                .photographerId(image.getPhotographer().getId())
                .imageUrl(image.getImageUrl())
                .category(image.getCategory())
                .uploadedAt(image.getUploadedAt())
                .verificationStatus(image.getVerificationStatus())
                .flagReason(image.getFlagReason())
                .build();
    }
}
