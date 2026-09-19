package com.shuttershot.service;

import com.shuttershot.dto.AuthResponse;
import com.shuttershot.dto.LoginRequest;
import com.shuttershot.dto.RegisterRequest;
import com.shuttershot.exception.DuplicateResourceException;
import com.shuttershot.exception.InvalidRequestException;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.PhotographerProfile;
import com.shuttershot.model.Role;
import com.shuttershot.model.User;
import com.shuttershot.repository.BannedEmailRepository;
import com.shuttershot.repository.PhotographerProfileRepository;
import com.shuttershot.repository.UserRepository;
import com.shuttershot.util.BangladeshDistricts;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PhotographerProfileRepository photographerProfileRepository;
    private final BannedEmailRepository bannedEmailRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        requireNotBanned(request.getEmail());
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }
        if (!StringUtils.hasText(request.getLocation())) {
            throw new InvalidRequestException("District is required");
        }
        if (!BangladeshDistricts.isValid(request.getLocation())) {
            throw new InvalidRequestException("Location must be a valid Bangladesh district");
        }

        User user = User.builder()
                .role(Role.PHOTOGRAPHER)
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .storedPassword(request.getPassword())
                .phone(request.getPhone())
                .location(request.getLocation())
                .verified(false)
                .build();
        user = userRepository.save(user);

        PhotographerProfile profile = PhotographerProfile.builder()
                .user(user)
                .baseLocation(request.getLocation())
                .build();
        photographerProfileRepository.save(profile);

        String token = jwtService.generateToken(new UserPrincipal(user), user.getId(), user.getRole().name());
        return toAuthResponse(user, token);
    }

    @Transactional
    public AuthResponse registerCustomer(RegisterRequest request) {
        requireNotBanned(request.getEmail());
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }

        User user = User.builder()
                .role(Role.CUSTOMER)
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .storedPassword(request.getPassword())
                .phone(request.getPhone())
                .location(request.getLocation())
                .verified(false)
                .build();
        user = userRepository.save(user);

        String token = jwtService.generateToken(new UserPrincipal(user), user.getId(), user.getRole().name());
        return toAuthResponse(user, token);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String token = jwtService.generateToken(new UserPrincipal(user), user.getId(), user.getRole().name());
        return toAuthResponse(user, token);
    }

    // A banned email stays blocked even after the banned account itself is
    // deleted — see AdminUserService.ban, which is what populates this list.
    private void requireNotBanned(String email) {
        if (bannedEmailRepository.existsByEmailIgnoreCase(email)) {
            throw new InvalidRequestException("This email is not allowed to register a new account");
        }
    }

    private AuthResponse toAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
