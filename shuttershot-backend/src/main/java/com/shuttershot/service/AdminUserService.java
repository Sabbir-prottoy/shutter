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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private static final Logger log = LoggerFactory.getLogger(AdminUserService.class);
    // The original, pre-existing admin account — the only one allowed to
    // manage staff accounts, and never itself removable or password-exposed
    // through this feature.
    private static final String MAIN_ADMIN_EMAIL = "admin@shuttershot.com";

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

    // Staff management (list/create/remove) is exclusively the main admin's
    // privilege — every method here starts by checking that.
    @Transactional(readOnly = true)
    public List<StaffAccountResponse> listStaff(Role role, Long actingAdminId) {
        requireMainAdmin(actingAdminId, "view");
        if (role != Role.ADMIN && role != Role.MODERATOR) {
            throw new InvalidRequestException("Staff accounts must be either ADMIN or MODERATOR");
        }
        return userRepository.findByRole(role).stream().map(this::toStaffResponse).toList();
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

    // Permanently removes an admin/moderator account. Only the main admin
    // may call this, and the main admin's own account can never be the target.
    @Transactional
    public void removeStaff(Long userId, Long actingAdminId) {
        requireMainAdmin(actingAdminId, "remove");

        User user = findById(userId);
        if (user.getRole() != Role.ADMIN && user.getRole() != Role.MODERATOR) {
            throw new InvalidRequestException("This account is not a staff account");
        }
        if (MAIN_ADMIN_EMAIL.equalsIgnoreCase(user.getEmail())) {
            throw new InvalidRequestException("The main admin account can't be removed");
        }

        bookingRepository.clearCustomerReference(userId);
        passwordResetTokenRepository.deleteByUserId(userId);
        fileStorageService.delete(user.getProfilePhotoUrl());
        userRepository.delete(user);
    }

    // Only the main admin may create staff accounts, and the password is
    // whatever they chose for it — not auto-generated.
    @Transactional
    public StaffAccountResponse createStaff(CreateStaffAccountRequest request, Long actingAdminId) {
        requireMainAdmin(actingAdminId, "add");

        if (request.getRole() != Role.ADMIN && request.getRole() != Role.MODERATOR) {
            throw new InvalidRequestException("Staff accounts must be either ADMIN or MODERATOR");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }

        User user = User.builder()
                .role(request.getRole())
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .storedPassword(request.getPassword())
                .verified(true)
                .build();
        user = userRepository.save(user);

        sendCredentialsEmail(user, request.getPassword());

        return toStaffResponse(user);
    }

    private void requireMainAdmin(Long actingAdminId, String action) {
        User actingUser = findById(actingAdminId);
        if (!MAIN_ADMIN_EMAIL.equalsIgnoreCase(actingUser.getEmail())) {
            throw new AccessDeniedException("Only the main admin can " + action + " staff accounts");
        }
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
                            + "Password: " + password + "\n\n"
                            + "Sign in at the admin portal."
            );
            mailSender.send(message);
        } catch (MailException ex) {
            log.warn("Could not send staff credentials email to {} (is MAIL_USERNAME/MAIL_PASSWORD configured?)",
                    user.getEmail(), ex);
        }
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

    private StaffAccountResponse toStaffResponse(User user) {
        boolean isMainAdmin = MAIN_ADMIN_EMAIL.equalsIgnoreCase(user.getEmail());
        return StaffAccountResponse.builder()
                .id(user.getId())
                .role(user.getRole())
                .name(user.getName())
                .email(user.getEmail())
                .password(isMainAdmin ? null : user.getStoredPassword())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
