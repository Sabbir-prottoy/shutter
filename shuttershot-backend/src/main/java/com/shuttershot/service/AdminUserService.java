package com.shuttershot.service;

import com.shuttershot.dto.AccountHistoryResponse;
import com.shuttershot.dto.AdminUserResponse;
import com.shuttershot.dto.CreateStaffAccountRequest;
import com.shuttershot.dto.StaffAccountResponse;
import com.shuttershot.exception.DuplicateResourceException;
import com.shuttershot.exception.InvalidRequestException;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.BannedEmail;
import com.shuttershot.model.PortfolioImage;
import com.shuttershot.model.Role;
import com.shuttershot.model.User;
import com.shuttershot.repository.AvailabilityRepository;
import com.shuttershot.repository.BannedEmailRepository;
import com.shuttershot.repository.BlueBadgeRepository;
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

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private static final Logger log = LoggerFactory.getLogger(AdminUserService.class);

    private final UserRepository userRepository;
    private final MainAdminGuard mainAdminGuard;
    private final BannedEmailRepository bannedEmailRepository;
    private final BlueBadgeRepository blueBadgeRepository;
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
        mainAdminGuard.require(actingAdminId, "view staff accounts");
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

    // Permanently deletes the account and everything it owns, but leaves the
    // email free to register a brand new account afterward. See ban() for
    // the version that also blocks that.
    @Transactional
    public void justDelete(Long userId, Long actingAdminId) {
        User user = validateRemovableTarget(userId, actingAdminId);
        deleteUserCascade(user);
    }

    // Permanently deletes the account and everything it owns, and — unlike
    // justDelete() — records the email so it can never register a new
    // account on this platform again, under any role.
    @Transactional
    public void ban(Long userId, Long actingAdminId) {
        User user = validateRemovableTarget(userId, actingAdminId);
        String email = user.getEmail();

        deleteUserCascade(user);

        if (!bannedEmailRepository.existsByEmailIgnoreCase(email)) {
            bannedEmailRepository.save(BannedEmail.builder().email(email).build());
        }
    }

    private User validateRemovableTarget(Long userId, Long actingAdminId) {
        if (userId.equals(actingAdminId)) {
            throw new InvalidRequestException("You cannot remove your own account");
        }

        User user = findById(userId);
        if (user.getRole() == Role.ADMIN || user.getRole() == Role.MODERATOR) {
            throw new InvalidRequestException("Admin and moderator accounts can't be removed this way");
        }
        return user;
    }

    // Permanently removes an admin/moderator account. Only the main admin
    // may call this, and the main admin's own account can never be the target.
    @Transactional
    public void removeStaff(Long userId, Long actingAdminId) {
        mainAdminGuard.require(actingAdminId, "remove staff accounts");

        User user = findById(userId);
        if (user.getRole() != Role.ADMIN && user.getRole() != Role.MODERATOR) {
            throw new InvalidRequestException("This account is not a staff account");
        }
        if (mainAdminGuard.isMainAdmin(user)) {
            throw new InvalidRequestException("The main admin account can't be removed");
        }

        bookingRepository.clearCustomerReference(userId);
        passwordResetTokenRepository.deleteByUserId(userId);
        fileStorageService.delete(user.getProfilePhotoUrl());
        userRepository.delete(user);
    }

    // Only the main admin may view these — every existing photographer's or
    // user's account details, including the password currently set (kept in
    // sync on every change; see AuthService.register/registerCustomer and
    // PasswordResetService.resetPassword).
    @Transactional(readOnly = true)
    public List<AccountHistoryResponse> listPhotographerHistory(Long actingAdminId) {
        return listAccountHistory(Role.PHOTOGRAPHER, actingAdminId, "photographer");
    }

    @Transactional(readOnly = true)
    public List<AccountHistoryResponse> listUserHistory(Long actingAdminId) {
        return listAccountHistory(Role.CUSTOMER, actingAdminId, "user");
    }

    private List<AccountHistoryResponse> listAccountHistory(Role role, Long actingAdminId, String entityLabel) {
        mainAdminGuard.require(actingAdminId, "view " + entityLabel + " history");
        return userRepository.findByRole(role).stream()
                .sorted(Comparator.comparing(User::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toAccountHistoryResponse)
                .toList();
    }

    // Permanently deletes one account and everything it owns. Requires the
    // main admin to re-enter their own password as an extra confirmation on
    // top of the main-admin-only gate.
    @Transactional
    public void removePhotographerHistory(Long userId, Long actingAdminId, String confirmPassword) {
        removeAccountHistory(userId, Role.PHOTOGRAPHER, actingAdminId, confirmPassword, "photographer");
    }

    @Transactional
    public void removeUserHistory(Long userId, Long actingAdminId, String confirmPassword) {
        removeAccountHistory(userId, Role.CUSTOMER, actingAdminId, confirmPassword, "user");
    }

    private void removeAccountHistory(
            Long userId, Role role, Long actingAdminId, String confirmPassword, String entityLabel) {
        mainAdminGuard.require(actingAdminId, "remove " + entityLabel + " history");
        verifyMainAdminPassword(actingAdminId, confirmPassword);

        User user = findById(userId);
        if (user.getRole() != role) {
            throw new InvalidRequestException("This account is not a " + entityLabel);
        }
        deleteUserCascade(user);
    }

    // The bulk versions — wipe every account of that role on the platform.
    // Same main-admin + password gate as the single-account version.
    @Transactional
    public void removeAllPhotographerHistory(Long actingAdminId, String confirmPassword) {
        removeAllAccountHistory(Role.PHOTOGRAPHER, actingAdminId, confirmPassword, "photographer");
    }

    @Transactional
    public void removeAllUserHistory(Long actingAdminId, String confirmPassword) {
        removeAllAccountHistory(Role.CUSTOMER, actingAdminId, confirmPassword, "user");
    }

    private void removeAllAccountHistory(Role role, Long actingAdminId, String confirmPassword, String entityLabel) {
        mainAdminGuard.require(actingAdminId, "remove " + entityLabel + " history");
        verifyMainAdminPassword(actingAdminId, confirmPassword);

        userRepository.findByRole(role).forEach(this::deleteUserCascade);
    }

    // Shared by the photographer "ban" action and both photographer-history
    // removal paths — deletes a photographer's profile, packages, portfolio
    // (files included), availability, reviews and bookings, then the account
    // itself. Any booking made elsewhere while this person was logged in as
    // a customer is anonymized rather than deleted.
    private void deleteUserCascade(User user) {
        Long userId = user.getId();
        bookingRepository.clearCustomerReference(userId);

        photographerProfileRepository.findByUserId(userId).ifPresent(profile -> {
            reviewRepository.deleteAll(reviewRepository.findByPhotographerId(profile.getId()));
            bookingRepository.deleteAll(bookingRepository.findByPhotographerId(profile.getId()));
            availabilityRepository.deleteAll(availabilityRepository.findByPhotographerId(profile.getId()));
            blueBadgeRepository.findByPhotographerId(profile.getId()).ifPresent(blueBadgeRepository::delete);

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

    // Only the main admin may create staff accounts, and the password is
    // whatever they chose for it — not auto-generated.
    @Transactional
    public StaffAccountResponse createStaff(CreateStaffAccountRequest request, Long actingAdminId) {
        mainAdminGuard.require(actingAdminId, "add staff accounts");

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

    private void verifyMainAdminPassword(Long actingAdminId, String confirmPassword) {
        User actingUser = findById(actingAdminId);
        if (confirmPassword == null || !passwordEncoder.matches(confirmPassword, actingUser.getPasswordHash())) {
            throw new InvalidRequestException("Incorrect password");
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
        boolean isMainAdmin = mainAdminGuard.isMainAdmin(user);
        return StaffAccountResponse.builder()
                .id(user.getId())
                .role(user.getRole())
                .name(user.getName())
                .email(user.getEmail())
                .password(isMainAdmin ? null : user.getStoredPassword())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private AccountHistoryResponse toAccountHistoryResponse(User user) {
        return AccountHistoryResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .location(user.getLocation())
                .password(user.getStoredPassword())
                .joinedAt(user.getCreatedAt())
                .build();
    }
}
