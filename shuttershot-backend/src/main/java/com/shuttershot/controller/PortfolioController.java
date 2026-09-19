package com.shuttershot.controller;

import com.shuttershot.dto.PortfolioImageResponse;
import com.shuttershot.dto.UpdatePortfolioCaptionRequest;
import com.shuttershot.model.ImageCategory;
import com.shuttershot.service.PortfolioService;
import com.shuttershot.service.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    @GetMapping
    public ResponseEntity<List<PortfolioImageResponse>> listOwn(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(portfolioService.listOwn(principal.getId()));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PortfolioImageResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("category") ImageCategory category,
            @RequestParam(value = "caption", required = false) String caption,
            @AuthenticationPrincipal UserPrincipal principal) {
        PortfolioImageResponse response = portfolioService.upload(file, category, caption, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PortfolioImageResponse> updateCaption(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePortfolioCaptionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(portfolioService.updateCaption(id, request.getCaption(), principal.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        portfolioService.delete(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
