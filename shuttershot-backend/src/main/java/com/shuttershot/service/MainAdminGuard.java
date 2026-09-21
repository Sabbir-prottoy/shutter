package com.shuttershot.service;

import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.User;
import com.shuttershot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

// The original, pre-existing admin account is the only one allowed to
// manage staff, blue-badge pricing, and other site-wide/sensitive settings.
// Shared by every service that needs that check, so the definition of "main
// admin" lives in exactly one place.
@Component
@RequiredArgsConstructor
public class MainAdminGuard {

    private static final String MAIN_ADMIN_EMAIL = "admin@shuttershot.com";

    private final UserRepository userRepository;

    public void require(Long actingAdminId, String action) {
        User actingUser = userRepository.findById(actingAdminId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + actingAdminId));
        if (!isMainAdmin(actingUser)) {
            throw new AccessDeniedException("Only the main admin can " + action);
        }
    }

    public boolean isMainAdmin(User user) {
        return MAIN_ADMIN_EMAIL.equalsIgnoreCase(user.getEmail());
    }

    public boolean isMainAdminEmail(String email) {
        return MAIN_ADMIN_EMAIL.equalsIgnoreCase(email);
    }
}
