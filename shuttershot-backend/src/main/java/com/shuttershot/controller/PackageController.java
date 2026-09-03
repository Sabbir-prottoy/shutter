package com.shuttershot.controller;

import com.shuttershot.dto.CreatePackageRequest;
import com.shuttershot.dto.PackageResponse;
import com.shuttershot.dto.UpdatePackageRequest;
import com.shuttershot.service.PackageService;
import com.shuttershot.service.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/packages")
@RequiredArgsConstructor
public class PackageController {

    private final PackageService packageService;

    @GetMapping
    public ResponseEntity<List<PackageResponse>> listOwn(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(packageService.listOwn(principal.getId()));
    }

    @PostMapping
    public ResponseEntity<PackageResponse> create(
            @Valid @RequestBody CreatePackageRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        PackageResponse response = packageService.create(request, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PackageResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePackageRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(packageService.update(id, request, principal.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        packageService.delete(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
