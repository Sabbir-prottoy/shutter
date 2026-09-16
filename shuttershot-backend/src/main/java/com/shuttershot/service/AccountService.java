package com.shuttershot.service;

import com.shuttershot.dto.AccountResponse;
import com.shuttershot.dto.UpdateAccountRequest;
import com.shuttershot.exception.DuplicateResourceException;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.User;
import com.shuttershot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public AccountResponse getOwnAccount(Long authenticatedUserId) {
        return toResponse(findById(authenticatedUserId));
    }

    @Transactional
    public AccountResponse update(Long authenticatedUserId, UpdateAccountRequest request) {
        User user = findById(authenticatedUserId);

        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getLocation() != null) {
            user.setLocation(request.getLocation());
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

        return toResponse(user);
    }

    @Transactional
    public AccountResponse updatePhoto(Long authenticatedUserId, MultipartFile file) {
        User user = findById(authenticatedUserId);
        String newUrl = fileStorageService.store(file);
        fileStorageService.delete(user.getProfilePhotoUrl());
        user.setProfilePhotoUrl(newUrl);
        return toResponse(user);
    }

    private User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private AccountResponse toResponse(User user) {
        return AccountResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .location(user.getLocation())
                .profilePhotoUrl(user.getProfilePhotoUrl())
                .bio(user.getBio())
                .role(user.getRole())
                .build();
    }
}
