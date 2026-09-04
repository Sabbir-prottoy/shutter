package com.shuttershot.service;

import com.shuttershot.dto.AdminUserResponse;
import com.shuttershot.exception.InvalidRequestException;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.Role;
import com.shuttershot.model.User;
import com.shuttershot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AdminUserResponse> listUsers(Role role) {
        List<User> users = role != null ? userRepository.findByRole(role) : userRepository.findAll();
        return users.stream().map(this::toResponse).toList();
    }

    @Transactional
    public AdminUserResponse verify(Long userId) {
        User user = findById(userId);
        user.setVerified(true);
        return toResponse(user);
    }

    @Transactional
    public AdminUserResponse ban(Long userId, Long actingAdminId) {
        if (userId.equals(actingAdminId)) {
            throw new InvalidRequestException("You cannot ban your own account");
        }

        User user = findById(userId);
        user.setEnabled(false);
        return toResponse(user);
    }

    @Transactional
    public AdminUserResponse unban(Long userId) {
        User user = findById(userId);
        user.setEnabled(true);
        return toResponse(user);
    }

    private User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private AdminUserResponse toResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .role(user.getRole())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .location(user.getLocation())
                .verified(user.isVerified())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
