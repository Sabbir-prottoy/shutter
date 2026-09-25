package com.shuttershot.controller;

import com.shuttershot.dto.CreateReviewRequest;
import com.shuttershot.dto.ReviewReplyRequest;
import com.shuttershot.dto.ReviewResponse;
import com.shuttershot.service.ReviewService;
import com.shuttershot.service.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewResponse> create(@Valid @RequestBody CreateReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<ReviewResponse>> list(@RequestParam Long photographerId) {
        return ResponseEntity.ok(reviewService.listApprovedByPhotographer(photographerId));
    }

    // A photographer's own feedback list, and their replies to it. There is
    // deliberately no approve/reject/delete here: ratings publish on submit and
    // only an admin can take one down.
    @GetMapping("/mine")
    public ResponseEntity<List<ReviewResponse>> mine(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(reviewService.listOwn(principal.getId()));
    }

    @PutMapping("/{id}/reply")
    public ResponseEntity<ReviewResponse> reply(
            @PathVariable Long id,
            @Valid @RequestBody ReviewReplyRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(reviewService.reply(id, request.getReply(), principal.getId()));
    }
}
