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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final PortfolioImageRepository portfolioImageRepository;
    private final PhotographerProfileRepository photographerProfileRepository;
    private final ImageVerificationService imageVerificationService;
    private final FileStorageService fileStorageService;
    private final AiImageDetectionService aiImageDetectionService;
    private final DetectraAiDetectionService detectraAiDetectionService;
    private final ImageFingerprintService imageFingerprintService;

    @Value("${detectra.reject-threshold}")
    private double rejectThreshold;

    @Value("${duplicate-check.max-distance}")
    private int duplicateDistance;

    @Transactional(readOnly = true)
    public List<PortfolioImageResponse> listByPhotographer(Long photographerId) {
        return portfolioImageRepository.findByPhotographerId(photographerId).stream()
                .filter(image -> image.getVerificationStatus() == VerificationStatus.VERIFIED)
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PortfolioImageResponse> listOwn(Long authenticatedUserId) {
        PhotographerProfile photographer = findOwnProfile(authenticatedUserId);
        return portfolioImageRepository.findByPhotographerId(photographer.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PortfolioImageResponse upload(
            MultipartFile file, ImageCategory category, String caption, Long authenticatedUserId) {
        PhotographerProfile photographer = findOwnProfile(authenticatedUserId);

        ImageVerificationService.VerificationResult result = imageVerificationService.verify(file);
        String imageUrl = fileStorageService.store(file);

        PortfolioImage image = PortfolioImage.builder()
                .photographer(photographer)
                .imageUrl(imageUrl)
                .category(category)
                .caption(blankToNull(caption))
                .exifData(result.exifDataJson())
                .build();

        applyAutomaticScreening(image, file, photographer.getId(), result.note());

        return toResponse(portfolioImageRepository.save(image));
    }

    /**
     * Decides the upload's initial fate in two passes: Detectra v3 screens for
     * AI-generated imagery, then the fingerprint check looks for a picture
     * already published on ShutterShot. Either rejects outright; a photo that
     * clears both goes live immediately.
     *
     * <p>Rejected or not, the photo stays in the admin moderation panel so an
     * admin can deep-check and overturn the call. If screening cannot run at
     * all the photo waits for manual review — an unscreened upload is never
     * auto-published.
     */
    private void applyAutomaticScreening(
            PortfolioImage image, MultipartFile file, Long photographerId, String metadataNote) {
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException ex) {
            holdForManualReview(image, "Couldn't be read for screening — needs manual review.", metadataNote);
            return;
        }

        Optional<DetectraAiDetectionService.DetectraResult> screening = detectraAiDetectionService.check(bytes);
        if (screening.isEmpty()) {
            holdForManualReview(image, "Detectra v3 couldn't screen this photo — needs manual review.", metadataNote);
            return;
        }

        imageFingerprintService.fingerprint(bytes).ifPresent(fingerprint -> {
            image.setContentHash(fingerprint.contentHash());
            image.setPerceptualHash(fingerprint.perceptualHash());
        });

        DetectraAiDetectionService.DetectraResult detectra = screening.get();
        int percent = (int) Math.round(detectra.probabilityAi() * 100);

        image.setDetectraVerdict(detectra.verdict());
        image.setDetectraConfidence(detectra.probabilityAi());
        image.setDetectraCheckedAt(LocalDateTime.now());

        if (detectra.probabilityAi() >= rejectThreshold) {
            image.setVerificationStatus(VerificationStatus.FLAGGED);
            image.setFlagReason(join(
                    "Auto-rejected by Detectra v3 — detected as AI-generated (" + percent + "% confidence).",
                    metadataNote));
            image.setRejectionReason("Our AI detector (Detectra v3) is " + percent
                    + "% confident this image was AI-generated. ShutterShot only publishes photographs "
                    + "you captured yourself. If you believe this is a mistake, contact support and an "
                    + "admin will take another look.");
            return;
        }

        Optional<DuplicateMatch> duplicate = findExistingCopy(image, photographerId);
        if (duplicate.isPresent()) {
            DuplicateMatch match = duplicate.get();
            image.setVerificationStatus(VerificationStatus.FLAGGED);
            image.setFlagReason(join(
                    "Auto-rejected — already on ShutterShot as photo #" + match.imageId()
                            + (match.ownPhoto() ? " (same photographer)." : " (another photographer)."),
                    metadataNote));
            image.setRejectionReason(match.ownPhoto()
                    ? "You have already uploaded this photo to your portfolio, so it can't be added twice."
                    : "This picture is already published on another photographer's ShutterShot portfolio. "
                      + "You can only upload photographs you took yourself. If you believe this is a "
                      + "mistake, contact support and an admin will take another look.");
            return;
        }

        image.setVerificationStatus(VerificationStatus.VERIFIED);
        image.setFlagReason(metadataNote);
        image.setRejectionReason(null);
    }

    private record DuplicateMatch(Long imageId, boolean ownPhoto) {
    }

    /**
     * Looks for the same picture already published on the platform — an exact
     * byte match first, then a perceptual match that survives re-encoding,
     * resizing and light cropping.
     */
    private Optional<DuplicateMatch> findExistingCopy(PortfolioImage image, Long photographerId) {
        if (image.getContentHash() == null || image.getPerceptualHash() == null) {
            return Optional.empty();
        }

        Optional<PortfolioImage> exact = portfolioImageRepository
                .findByVerificationStatusAndContentHash(VerificationStatus.VERIFIED, image.getContentHash())
                .stream()
                .findFirst();
        if (exact.isPresent()) {
            return Optional.of(new DuplicateMatch(
                    exact.get().getId(),
                    exact.get().getPhotographer().getId().equals(photographerId)));
        }

        return portfolioImageRepository.findHashesByVerificationStatus(VerificationStatus.VERIFIED).stream()
                .filter(candidate -> ImageFingerprintService.distance(
                        candidate.getPerceptualHash(), image.getPerceptualHash()) <= duplicateDistance)
                .findFirst()
                .map(candidate -> new DuplicateMatch(
                        candidate.getId(), candidate.getPhotographerId().equals(photographerId)));
    }

    private void holdForManualReview(PortfolioImage image, String reason, String metadataNote) {
        image.setVerificationStatus(VerificationStatus.PENDING);
        image.setFlagReason(join(reason, metadataNote));
    }

    private String join(String primary, String note) {
        return (note == null || note.isBlank()) ? primary : primary + " " + note;
    }

    @Transactional
    public PortfolioImageResponse updateCaption(Long imageId, String caption, Long authenticatedUserId) {
        PortfolioImage image = findById(imageId);
        PhotographerProfile owner = findOwnProfile(authenticatedUserId);

        if (!image.getPhotographer().getId().equals(owner.getId())) {
            throw new AccessDeniedException("You can only edit your own portfolio images");
        }

        image.setCaption(blankToNull(caption));
        return toResponse(image);
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
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

    // Every photo the platform holds, newest first — including ones already
    // published and ones Detectra v3 auto-rejected, so an admin can deep-check
    // and overturn either call at any time.
    @Transactional(readOnly = true)
    public List<PortfolioImageResponse> listForModeration(VerificationStatus status) {
        List<PortfolioImage> images = (status == null)
                ? portfolioImageRepository.findAllByOrderByUploadedAtDesc()
                : portfolioImageRepository.findByVerificationStatusOrderByUploadedAtDesc(status);
        return images.stream().map(this::toResponse).toList();
    }

    @Transactional
    public PortfolioImageResponse approveByAdmin(Long imageId) {
        PortfolioImage image = findById(imageId);
        if (image.getVerificationStatus() == VerificationStatus.VERIFIED) {
            throw new InvalidRequestException("That photo is already published");
        }

        image.setVerificationStatus(VerificationStatus.VERIFIED);
        image.setFlagReason(null);
        image.setRejectionReason(null);
        return toResponse(image);
    }

    // Admin-triggered, on demand — never run automatically on upload, since
    // it's a paid external call (see AiImageDetectionService). Re-running it
    // on an already-checked image simply overwrites the previous result.
    @Transactional
    public PortfolioImageResponse checkForAi(Long imageId) {
        PortfolioImage image = findById(imageId);
        byte[] imageBytes = fileStorageService.loadBytes(image.getImageUrl());
        String filename = image.getImageUrl().substring(image.getImageUrl().lastIndexOf('/') + 1);

        AiImageDetectionService.AiCheckResult result = aiImageDetectionService.check(imageBytes, filename);

        image.setAiCheckVerdict(result.verdict());
        image.setAiCheckConfidence(result.confidence());
        image.setAiCheckGenerator(result.generator());
        image.setAiCheckedAt(LocalDateTime.now());

        return toResponse(image);
    }

    // Takes the photo off the public profile but keeps the row and the file, so
    // it stays reviewable in the moderation panel and the decision is reversible.
    // Works on an already-published photo too — that's the whole point of being
    // able to deep-check after the fact.
    @Transactional
    public PortfolioImageResponse rejectByAdmin(Long imageId) {
        PortfolioImage image = findById(imageId);
        if (image.getVerificationStatus() == VerificationStatus.FLAGGED) {
            throw new InvalidRequestException("That photo is already rejected");
        }

        image.setVerificationStatus(VerificationStatus.FLAGGED);
        image.setFlagReason("Rejected by an admin after review.");
        image.setRejectionReason("An admin reviewed this photo and removed it from your public "
                + "profile. ShutterShot only publishes photographs you captured yourself. If you "
                + "believe this is a mistake, contact support.");
        return toResponse(image);
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
                .caption(image.getCaption())
                .uploadedAt(image.getUploadedAt())
                .verificationStatus(image.getVerificationStatus())
                .flagReason(image.getFlagReason())
                .rejectionReason(image.getRejectionReason())
                .detectraVerdict(image.getDetectraVerdict())
                .detectraConfidence(image.getDetectraConfidence())
                .detectraCheckedAt(image.getDetectraCheckedAt())
                .aiCheckVerdict(image.getAiCheckVerdict())
                .aiCheckConfidence(image.getAiCheckConfidence())
                .aiCheckGenerator(image.getAiCheckGenerator())
                .aiCheckedAt(image.getAiCheckedAt())
                .build();
    }
}
