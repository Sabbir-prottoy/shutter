package com.shuttershot.service;

import com.shuttershot.dto.AdminUserResponse;
import com.shuttershot.dto.CreateStaffAccountRequest;
import com.shuttershot.dto.StaffAccountResponse;
import com.shuttershot.exception.DuplicateResourceException;
import com.shuttershot.exception.InvalidRequestException;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.PortfolioImage;
import com.shuttershot.model.Role;
import com.shuttershot.model.User;
import com.shuttershot.repository.AvailabilityRepository;
import com.shuttershot.repository.BookingRepository;
import com.shuttershot.repository.PackageRepository;
import com.shuttershot.repository.PasswordResetTokenRepository;
import com.shuttershot.repository.PhotographerProfileRepository;
import com.shuttershot.repository.PortfolioImageRepository;
import com.shuttershot.repository.ReviewRepository;
import com.shuttershot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private static final Logger log = LoggerFactory.getLogger(AdminUserService.class);
    private static final String PASSWORD_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String PASSWORD_LOWER = "abcdefghijkmnopqrstuvwxyz";
    private static final String PASSWORD_DIGITS = "23456789";
    private static final String PASSWORD_SYMBOLS = "!@#$%&*";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PhotographerProfileRepository photographerProfileRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final PackageRepository packageRepository;
    private final AvailabilityRepository availabilityRepository;
    private final PortfolioImageRepository portfolioImageRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final FileStorageService fileStorageService;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    @Value("${app.mail-from}")
    private String mailFrom;

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

    // "Ban" now means permanent removal — the account, its public profile,
    // and everything it owns are deleted outright rather than just disabled,
    // per how the platform's moderation is meant to work.
    @Transactional
    public void remove(Long userId, Long actingAdminId) {
        if (userId.equals(actingAdminId)) {
            throw new InvalidRequestException("You cannot remove your own account");
        }

        User user = findById(userId);
        if (user.getRole() == Role.ADMIN || user.getRole() == Role.MODERATOR) {
            throw new InvalidRequestException("Admin and moderator accounts can't be removed this way");
        }

        bookingRepository.clearCustomerReference(userId);

        photographerProfileRepository.findByUserId(userId).ifPresent(profile -> {
            reviewRepository.deleteAll(reviewRepository.findByPhotographerId(profile.getId()));
            bookingRepository.deleteAll(bookingRepository.findByPhotographerId(profile.getId()));
            availabilityRepository.deleteAll(availabilityRepository.findByPhotographerId(profile.getId()));

            List<PortfolioImage> images = portfolioImageRepository.findByPhotographerId(profile.getId());
            images.forEach(image -> fileStorageService.delete(image.getImageUrl()));
            portfolioImageRepository.deleteAll(images);

            packageRepository.deleteAll(packageRepository.findByPhotographerId(profile.getId()));
            photographerProfileRepository.delete(profile);
        });

        passwordResetTokenRepository.deleteByUserId(userId);
        fileStorageService.delete(user.getProfilePhotoUrl());
        userRepository.delete(user);
    }

    @Transactional
    public StaffAccountResponse createStaff(CreateStaffAccountRequest request) {
        if (request.getRole() != Role.ADMIN && request.getRole() != Role.MODERATOR) {
            throw new InvalidRequestException("Staff accounts must be either ADMIN or MODERATOR");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }

        String generatedPassword = generateTemporaryPassword();
        User user = User.builder()
                .role(request.getRole())
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(generatedPassword))
                .verified(true)
                .build();
        user = userRepository.save(user);

        sendCredentialsEmail(user, generatedPassword);

        return StaffAccountResponse.builder()
                .id(user.getId())
                .role(user.getRole())
                .name(user.getName())
                .email(user.getEmail())
                .generatedPassword(generatedPassword)
                .build();
    }

    private void sendCredentialsEmail(User user, String password) {
        String roleLabel = user.getRole().name().toLowerCase();
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(user.getEmail());
            message.setSubject("Your ShutterShot " + roleLabel + " account");
            message.setText(
                    "Hi " + user.getName() + ",\n\n"
                            + "An account has been created for you on ShutterShot with " + roleLabel
                            + " access.\n\n"
                            + "Email: " + user.getEmail() + "\n"
                            + "Temporary password: " + password + "\n\n"
                            + "Sign in at the admin portal and change your password as soon as possible."
            );
            mailSender.send(message);
        } catch (MailException ex) {
            log.warn("Could not send staff credentials email to {} (is MAIL_USERNAME/MAIL_PASSWORD configured?) "
                    + "— generated password: {}", user.getEmail(), password, ex);
        }
    }

    private String generateTemporaryPassword() {
        List<Character> chars = new ArrayList<>();
        chars.add(PASSWORD_UPPER.charAt(RANDOM.nextInt(PASSWORD_UPPER.length())));
        chars.add(PASSWORD_LOWER.charAt(RANDOM.nextInt(PASSWORD_LOWER.length())));
        chars.add(PASSWORD_DIGITS.charAt(RANDOM.nextInt(PASSWORD_DIGITS.length())));
        chars.add(PASSWORD_SYMBOLS.charAt(RANDOM.nextInt(PASSWORD_SYMBOLS.length())));

        String all = PASSWORD_UPPER + PASSWORD_LOWER + PASSWORD_DIGITS + PASSWORD_SYMBOLS;
        for (int i = chars.size(); i < 12; i++) {
            chars.add(all.charAt(RANDOM.nextInt(all.length())));
        }

        Collections.shuffle(chars, RANDOM);
        StringBuilder password = new StringBuilder(chars.size());
        chars.forEach(password::append);
        return password.toString();
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
