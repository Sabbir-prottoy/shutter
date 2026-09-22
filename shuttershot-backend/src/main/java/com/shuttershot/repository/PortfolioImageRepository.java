package com.shuttershot.repository;

import com.shuttershot.model.PortfolioImage;
import com.shuttershot.model.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PortfolioImageRepository extends JpaRepository<PortfolioImage, Long> {

    List<PortfolioImage> findByPhotographerId(Long photographerId);

    List<PortfolioImage> findByVerificationStatus(VerificationStatus status);

    List<PortfolioImage> findAllByOrderByUploadedAtDesc();

    List<PortfolioImage> findByVerificationStatusOrderByUploadedAtDesc(VerificationStatus status);

    List<PortfolioImage> findByVerificationStatusAndContentHash(VerificationStatus status, String contentHash);

    // Only the fingerprint columns, so scanning for near-duplicates never
    // drags every image row into memory.
    @Query("""
            select image.id as id,
                   image.photographer.id as photographerId,
                   image.perceptualHash as perceptualHash
            from PortfolioImage image
            where image.verificationStatus = :status and image.perceptualHash is not null
            """)
    List<PerceptualHashView> findHashesByVerificationStatus(@Param("status") VerificationStatus status);

    interface PerceptualHashView {
        Long getId();

        Long getPhotographerId();

        Long getPerceptualHash();
    }

    List<PortfolioImage> findByContentHashIsNull();
}
