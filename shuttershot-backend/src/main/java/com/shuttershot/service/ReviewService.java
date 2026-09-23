package com.shuttershot.service;

import com.shuttershot.dto.CreateReviewRequest;
import com.shuttershot.dto.ReviewResponse;
import com.shuttershot.exception.DuplicateResourceException;
import com.shuttershot.exception.InvalidRequestException;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.Booking;
import com.shuttershot.model.BookingStatus;
import com.shuttershot.model.PhotographerProfile;
import com.shuttershot.model.Review;
import com.shuttershot.model.ReviewStatus;
import com.shuttershot.repository.BookingRepository;
import com.shuttershot.repository.PhotographerProfileRepository;
import com.shuttershot.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final PhotographerProfileRepository photographerProfileRepository;

    @Transactional
    public ReviewResponse create(CreateReviewRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + request.getBookingId()));

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new InvalidRequestException("You can only review a completed booking");
        }

        if (reviewRepository.existsByBookingId(booking.getId())) {
            throw new DuplicateResourceException("This booking has already been reviewed");
        }

        Review review = Review.builder()
                .booking(booking)
                .photographer(booking.getPhotographer())
                .clientName(booking.getClientName())
                .rating(request.getRating())
                .comment(request.getComment())
                .status(ReviewStatus.PENDING)
                .build();

        return toResponse(reviewRepository.save(review));
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> listApprovedByPhotographer(Long photographerId) {
        return reviewRepository.findByPhotographerIdAndStatus(photographerId, ReviewStatus.APPROVED).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> listPending() {
        return reviewRepository.findByStatus(ReviewStatus.PENDING).stream()
                .map(this::toResponse)
                .toList();
    }

    // The primary moderation path: a photographer reviewing ratings left about
    // their own work. Admin/moderator moderation above still exists as a
    // separate oversight path and is untouched by this.
    @Transactional(readOnly = true)
    public List<ReviewResponse> listPendingForPhotographer(Long authenticatedUserId) {
        PhotographerProfile photographer = findOwnProfile(authenticatedUserId);
        return reviewRepository.findByPhotographerIdAndStatus(photographer.getId(), ReviewStatus.PENDING).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ReviewResponse approveAsPhotographer(Long id, Long authenticatedUserId) {
        Review review = findById(id);
        requireOwnership(review, authenticatedUserId);
        return approve(id);
    }

    @Transactional
    public ReviewResponse rejectAsPhotographer(Long id, Long authenticatedUserId) {
        Review review = findById(id);
        requireOwnership(review, authenticatedUserId);
        return reject(id);
    }

    private void requireOwnership(Review review, Long authenticatedUserId) {
        Long ownerId = review.getPhotographer().getUser().getId();
        if (!ownerId.equals(authenticatedUserId)) {
            throw new AccessDeniedException("You can only moderate ratings left about your own profile");
        }
    }

    private PhotographerProfile findOwnProfile(Long authenticatedUserId) {
        return photographerProfileRepository.findByUserId(authenticatedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Photographer profile not found for current user"));
    }

    @Transactional
    public ReviewResponse approve(Long id) {
        Review review = findById(id);
        if (review.getStatus() != ReviewStatus.PENDING) {
            throw new InvalidRequestException("Only pending reviews can be approved");
        }

        review.setStatus(ReviewStatus.APPROVED);
        recalculateRating(review.getPhotographer());

        return toResponse(review);
    }

    @Transactional
    public ReviewResponse reject(Long id) {
        Review review = findById(id);
        if (review.getStatus() != ReviewStatus.PENDING) {
            throw new InvalidRequestException("Only pending reviews can be rejected");
        }

        review.setStatus(ReviewStatus.REJECTED);
        return toResponse(review);
    }

    private void recalculateRating(PhotographerProfile photographer) {
        long count = reviewRepository.countApprovedByPhotographerId(photographer.getId());
        Double average = reviewRepository.averageRatingByPhotographerId(photographer.getId());

        photographer.setTotalReviews((int) count);
        photographer.setRatingAvg(average != null ? average : 0.0);
        photographerProfileRepository.save(photographer);
    }

    private Review findById(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + id));
    }

    private ReviewResponse toResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .bookingId(review.getBooking().getId())
                .photographerId(review.getPhotographer().getId())
                .clientName(review.getClientName())
                .rating(review.getRating())
                .comment(review.getComment())
                .status(review.getStatus())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
