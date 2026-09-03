package com.shuttershot.service;

import com.shuttershot.dto.CreatePackageRequest;
import com.shuttershot.dto.PackageResponse;
import com.shuttershot.dto.UpdatePackageRequest;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.Package;
import com.shuttershot.model.PhotographerProfile;
import com.shuttershot.repository.PackageRepository;
import com.shuttershot.repository.PhotographerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PackageService {

    private final PackageRepository packageRepository;
    private final PhotographerProfileRepository photographerProfileRepository;

    @Transactional(readOnly = true)
    public List<PackageResponse> listByPhotographer(Long photographerId) {
        return packageRepository.findByPhotographerId(photographerId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PackageResponse> listOwn(Long authenticatedUserId) {
        PhotographerProfile photographer = findOwnProfile(authenticatedUserId);
        return packageRepository.findByPhotographerId(photographer.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PackageResponse create(CreatePackageRequest request, Long authenticatedUserId) {
        PhotographerProfile photographer = findOwnProfile(authenticatedUserId);

        Package pkg = Package.builder()
                .photographer(photographer)
                .title(request.getTitle())
                .description(request.getDescription())
                .price(request.getPrice())
                .durationHours(request.getDurationHours())
                .deliveryDays(request.getDeliveryDays())
                .build();

        return toResponse(packageRepository.save(pkg));
    }

    @Transactional
    public PackageResponse update(Long id, UpdatePackageRequest request, Long authenticatedUserId) {
        Package pkg = findById(id);
        assertOwnership(pkg, authenticatedUserId);

        if (request.getTitle() != null) {
            pkg.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            pkg.setDescription(request.getDescription());
        }
        if (request.getPrice() != null) {
            pkg.setPrice(request.getPrice());
        }
        if (request.getDurationHours() != null) {
            pkg.setDurationHours(request.getDurationHours());
        }
        if (request.getDeliveryDays() != null) {
            pkg.setDeliveryDays(request.getDeliveryDays());
        }

        return toResponse(pkg);
    }

    @Transactional
    public void delete(Long id, Long authenticatedUserId) {
        Package pkg = findById(id);
        assertOwnership(pkg, authenticatedUserId);
        packageRepository.delete(pkg);
    }

    private Package findById(Long id) {
        return packageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Package not found with id: " + id));
    }

    private PhotographerProfile findOwnProfile(Long authenticatedUserId) {
        return photographerProfileRepository.findByUserId(authenticatedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Photographer profile not found for current user"));
    }

    private void assertOwnership(Package pkg, Long authenticatedUserId) {
        PhotographerProfile owner = findOwnProfile(authenticatedUserId);
        if (!pkg.getPhotographer().getId().equals(owner.getId())) {
            throw new AccessDeniedException("You can only manage your own packages");
        }
    }

    private PackageResponse toResponse(Package pkg) {
        return PackageResponse.builder()
                .id(pkg.getId())
                .photographerId(pkg.getPhotographer().getId())
                .title(pkg.getTitle())
                .description(pkg.getDescription())
                .price(pkg.getPrice())
                .durationHours(pkg.getDurationHours())
                .deliveryDays(pkg.getDeliveryDays())
                .build();
    }
}
