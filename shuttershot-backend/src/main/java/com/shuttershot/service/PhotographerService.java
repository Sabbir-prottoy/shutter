package com.shuttershot.service;

import com.shuttershot.dto.OwnPhotographerProfileResponse;
import com.shuttershot.dto.PhotographerProfileResponse;
import com.shuttershot.dto.PhotographerSummaryResponse;
import com.shuttershot.dto.UpdatePhotographerProfileRequest;
import com.shuttershot.exception.DuplicateResourceException;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.PhotographerProfile;
import com.shuttershot.model.User;
import com.shuttershot.repository.PhotographerProfileRepository;
import com.shuttershot.repository.UserRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PhotographerService {

    private final PhotographerProfileRepository photographerProfileRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public List<PhotographerSummaryResponse> search(String location, String category) {
        Specification<PhotographerProfile> spec = Specification.where(null);

        if (StringUtils.hasText(location)) {
            String pattern = "%" + location.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("baseLocation")), pattern));
        }

        if (StringUtils.hasText(category)) {
            String normalizedCategory = category.toLowerCase();
            spec = spec.and((root, query, cb) -> {
                query.distinct(true);
                Join<PhotographerProfile, String> specialties = root.join("specialties", JoinType.LEFT);
                return cb.equal(cb.lower(specialties), normalizedCategory);
            });
        }

        return photographerProfileRepository.findAll(spec).stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public PhotographerProfileResponse getById(Long id) {
        return toProfileResponse(findById(id));
    }

    @Transactional(readOnly = true)
    public OwnPhotographerProfileResponse getOwnProfile(Long authenticatedUserId) {
        return toOwnProfileResponse(findOwnProfile(authenticatedUserId));
    }

    @Transactional
    public OwnPhotographerProfileResponse update(Long id, UpdatePhotographerProfileRequest request, Long authenticatedUserId) {
        PhotographerProfile profile = findById(id);
        User user = profile.getUser();

        if (!user.getId().equals(authenticatedUserId)) {
            throw new AccessDeniedException("You can only update your own profile");
        }

        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getLocation() != null) {
            user.setLocation(request.getLocation());
            // Kept in sync with the public search field so changing your
            // location here actually changes where clients can find you.
            profile.setBaseLocation(request.getLocation());
        }
        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new DuplicateResourceException("An account with this email already exists");
            }
            user.setEmail(request.getEmail());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getProfilePhotoUrl() != null) {
            user.setProfilePhotoUrl(request.getProfilePhotoUrl());
        }
        if (request.getSpecialties() != null) {
            profile.setSpecialties(request.getSpecialties());
        }
        if (request.getBaseLocation() != null) {
            profile.setBaseLocation(request.getBaseLocation());
        }
        if (request.getYearsExperience() != null) {
            profile.setYearsExperience(request.getYearsExperience());
        }

        return toOwnProfileResponse(profile);
    }

    @Transactional
    public OwnPhotographerProfileResponse updateProfilePhoto(MultipartFile file, Long authenticatedUserId) {
        PhotographerProfile profile = findOwnProfile(authenticatedUserId);
        User user = profile.getUser();

        String newUrl = fileStorageService.store(file);
        fileStorageService.delete(user.getProfilePhotoUrl());
        user.setProfilePhotoUrl(newUrl);

        return toOwnProfileResponse(profile);
    }

    private PhotographerProfile findById(Long id) {
        return photographerProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Photographer profile not found with id: " + id));
    }

    private PhotographerProfile findOwnProfile(Long authenticatedUserId) {
        return photographerProfileRepository.findByUserId(authenticatedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Photographer profile not found for current user"));
    }

    private PhotographerSummaryResponse toSummary(PhotographerProfile profile) {
        User user = profile.getUser();
        return PhotographerSummaryResponse.builder()
                .id(profile.getId())
                .name(user.getName())
                .profilePhotoUrl(user.getProfilePhotoUrl())
                .baseLocation(profile.getBaseLocation())
                .specialties(profile.getSpecialties())
                .yearsExperience(profile.getYearsExperience())
                .ratingAvg(profile.getRatingAvg())
                .totalReviews(profile.getTotalReviews())
                .verified(user.isVerified())
                .build();
    }

    private PhotographerProfileResponse toProfileResponse(PhotographerProfile profile) {
        User user = profile.getUser();
        return PhotographerProfileResponse.builder()
                .id(profile.getId())
                .name(user.getName())
                .bio(user.getBio())
                .profilePhotoUrl(user.getProfilePhotoUrl())
                .baseLocation(profile.getBaseLocation())
                .specialties(profile.getSpecialties())
                .yearsExperience(profile.getYearsExperience())
                .ratingAvg(profile.getRatingAvg())
                .totalReviews(profile.getTotalReviews())
                .verified(user.isVerified())
                .build();
    }

    private OwnPhotographerProfileResponse toOwnProfileResponse(PhotographerProfile profile) {
        User user = profile.getUser();
        return OwnPhotographerProfileResponse.builder()
                .id(profile.getId())
                .name(user.getName())
                .bio(user.getBio())
                .profilePhotoUrl(user.getProfilePhotoUrl())
                .baseLocation(profile.getBaseLocation())
                .specialties(profile.getSpecialties())
                .yearsExperience(profile.getYearsExperience())
                .ratingAvg(profile.getRatingAvg())
                .totalReviews(profile.getTotalReviews())
                .verified(user.isVerified())
                .phone(user.getPhone())
                .location(user.getLocation())
                .email(user.getEmail())
                .build();
    }
}
