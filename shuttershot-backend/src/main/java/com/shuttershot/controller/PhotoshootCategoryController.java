package com.shuttershot.controller;

import com.shuttershot.dto.CreatePhotoshootCategoryRequest;
import com.shuttershot.dto.PhotoshootCategoryResponse;
import com.shuttershot.service.PhotoshootCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Public read at /api/photoshoot-categories (permitAll - see SecurityConfig);
// add and remove under /api/admin/photoshoot-categories, already covered by the
// /api/admin/** ADMIN/MODERATOR rule.
@RestController
@RequiredArgsConstructor
public class PhotoshootCategoryController {

    private final PhotoshootCategoryService photoshootCategoryService;

    @GetMapping("/api/photoshoot-categories")
    public ResponseEntity<List<PhotoshootCategoryResponse>> listPublic() {
        return ResponseEntity.ok(photoshootCategoryService.list());
    }

    @GetMapping("/api/admin/photoshoot-categories")
    public ResponseEntity<List<PhotoshootCategoryResponse>> listForAdmin() {
        return ResponseEntity.ok(photoshootCategoryService.list());
    }

    @PostMapping("/api/admin/photoshoot-categories")
    public ResponseEntity<PhotoshootCategoryResponse> create(
            @Valid @RequestBody CreatePhotoshootCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(photoshootCategoryService.create(request));
    }

    @PutMapping("/api/admin/photoshoot-categories/{id}")
    public ResponseEntity<PhotoshootCategoryResponse> update(
            @PathVariable Long id, @Valid @RequestBody CreatePhotoshootCategoryRequest request) {
        return ResponseEntity.ok(photoshootCategoryService.update(id, request));
    }

    @DeleteMapping("/api/admin/photoshoot-categories/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        photoshootCategoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
