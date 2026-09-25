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

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final PhotographerProfileRepository photographerProfileRepository;

    // Published immediately: a rating goes live on the photographer's profile
    // and counts toward their average the moment it's submitted.
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
                .status(ReviewStatus.APPROVED)
                .build();

        Review saved = reviewRepository.save(review);
        recalculateRating(saved.getPhotographer());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> listApprovedByPhotographer(Long photographerId) {
        return reviewRepository
                .findByPhotographerIdAndStatusOrderByCreatedAtDesc(photographerId, ReviewStatus.APPROVED).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> listOwn(Long authenticatedUserId) {
        PhotographerProfile photographer = findOwnProfile(authenticatedUserId);
        return listApprovedByPhotographer(photographer.getId());
    }

    // Photographers can answer a rating about their own work, and edit that
    // answer later, but have no way to hide or delete the rating itself.
    @Transactional
    public ReviewResponse reply(Long id, String reply, Long authenticatedUserId) {
        Review review = findById(id);
        Long ownerId = review.getPhotographer().getUser().getId();
        if (!ownerId.equals(authenticatedUserId)) {
            throw new AccessDeniedException("You can only reply to ratings left about your own profile");
        }
        if (review.getStatus() != ReviewStatus.APPROVED) {
            throw new InvalidRequestException("That rating is no longer published");
        }

        review.setPhotographerReply(reply.trim());
        review.setRepliedAt(LocalDateTime.now());
        return toResponse(review);
    }

    // Admin oversight: every published review, newest first.
    @Transactional(readOnly = true)
    public List<ReviewResponse> listPublished() {
        return reviewRepository.findByStatusOrderByCreatedAtDesc(ReviewStatus.APPROVED).stream()
                .map(this::toResponse)
                .toList();
    }

    // Admin-only takedown for abusive or fake reviews; drops it from the
    // photographer's public profile and average.
    @Transactional
    public ReviewResponse remove(Long id) {
        Review review = findById(id);
        if (review.getStatus() != ReviewStatus.APPROVED) {
            throw new InvalidRequestException("That review is already removed");
        }

        review.setStatus(ReviewStatus.REJECTED);
        recalculateRating(review.getPhotographer());
        return toResponse(review);
    }

    private PhotographerProfile findOwnProfile(Long authenticatedUserId) {
        return photographerProfileRepository.findByUserId(authenticatedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Photographer profile not found for current user"));
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
                .photographerReply(review.getPhotographerReply())
                .repliedAt(review.getRepliedAt())
                .build();
    }
}
