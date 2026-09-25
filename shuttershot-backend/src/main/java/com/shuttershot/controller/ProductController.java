package com.shuttershot.controller;

import com.shuttershot.dto.CategoryCountResponse;
import com.shuttershot.dto.PagedResponse;
import com.shuttershot.dto.PhotoCreditResponse;
import com.shuttershot.dto.ProductRequest;
import com.shuttershot.dto.ProductResponse;
import com.shuttershot.exception.InvalidRequestException;
import com.shuttershot.model.ProductCategory;
import com.shuttershot.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Locale;

// Public shop reads under /api/products (permitAll - see SecurityConfig); product
// management under /api/admin/products, covered by the /api/admin/** rule.
@RestController
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping("/api/products")
    public ResponseEntity<PagedResponse<ProductResponse>> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(productService.list(parseCategory(category), q, sort, page, size));
    }

    @GetMapping("/api/products/categories")
    public ResponseEntity<List<CategoryCountResponse>> categories() {
        return ResponseEntity.ok(productService.categoryCounts());
    }

    @GetMapping("/api/products/photo-credits")
    public ResponseEntity<List<PhotoCreditResponse>> photoCredits() {
        return ResponseEntity.ok(productService.photoCredits());
    }

    @GetMapping("/api/products/by-ids")
    public ResponseEntity<List<ProductResponse>> byIds(@RequestParam List<Long> ids) {
        return ResponseEntity.ok(productService.byIds(ids));
    }

    @GetMapping("/api/admin/products")
    public ResponseEntity<List<ProductResponse>> listForAdmin() {
        return ResponseEntity.ok(productService.listAll());
    }

    @PostMapping("/api/admin/products")
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(request));
    }

    @PutMapping("/api/admin/products/{id}")
    public ResponseEntity<ProductResponse> update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.update(id, request));
    }

    @DeleteMapping("/api/admin/products/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/api/admin/products/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductResponse> setImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(productService.setImage(id, file));
    }

    @DeleteMapping("/api/admin/products/{id}/image")
    public ResponseEntity<ProductResponse> removeImage(@PathVariable Long id) {
        return ResponseEntity.ok(productService.removeImage(id));
    }

    private ProductCategory parseCategory(String category) {
        if (!StringUtils.hasText(category)) {
            return null;
        }
        try {
            return ProductCategory.valueOf(category.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new InvalidRequestException("Unknown category: " + category);
        }
    }
}
