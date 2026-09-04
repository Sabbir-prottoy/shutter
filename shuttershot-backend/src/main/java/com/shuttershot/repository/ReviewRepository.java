package com.shuttershot.repository;

import com.shuttershot.model.Review;
import com.shuttershot.model.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByPhotographerIdAndStatus(Long photographerId, ReviewStatus status);

    List<Review> findByStatus(ReviewStatus status);

    boolean existsByBookingId(Long bookingId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.photographer.id = :photographerId AND r.status = 'APPROVED'")
    long countApprovedByPhotographerId(@Param("photographerId") Long photographerId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.photographer.id = :photographerId AND r.status = 'APPROVED'")
    Double averageRatingByPhotographerId(@Param("photographerId") Long photographerId);
}
