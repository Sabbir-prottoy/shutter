package com.shuttershot.service;

import com.shuttershot.dto.AccountDeletionRequestResponse;
import com.shuttershot.exception.InvalidRequestException;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.AccountDeletionRequest;
import com.shuttershot.model.AccountDeletionRequestStatus;
import com.shuttershot.model.Role;
import com.shuttershot.model.User;
import com.shuttershot.repository.AccountDeletionRequestRepository;
import com.shuttershot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

// Lets a CUSTOMER or PHOTOGRAPHER ask for their own account to be deleted,
// and lets an admin/moderator approve or decline that request. Approving
// reuses AdminUserService.justDelete for the actual cascade delete (portfolio,
// bookings, reviews, etc.) rather than duplicating that logic here.
@Service
@RequiredArgsConstructor
public class AccountDeletionRequestService {

    private final AccountDeletionRequestRepository accountDeletionRequestRepository;
    private final UserRepository userRepository;
    private final AdminUserService adminUserService;

    @Transactional
    public AccountDeletionRequestResponse submit(Long userId, String reason) {
        User user = findUser(userId);
        if (user.getRole() != Role.CUSTOMER && user.getRole() != Role.PHOTOGRAPHER) {
            throw new InvalidRequestException("This account type can't request deletion this way");
        }

        AccountDeletionRequest request = accountDeletionRequestRepository.findByUserId(userId)
                .orElseGet(() -> AccountDeletionRequest.builder().user(user).build());

        if (request.getId() != null && request.getStatus() == AccountDeletionRequestStatus.PENDING) {
            throw new InvalidRequestException("You already have a pending account deletion request");
        }

        request.setReason(reason);
        request.setStatus(AccountDeletionRequestStatus.PENDING);
        request.setAdminNote(null);
        request.setResolvedAt(null);
        request = accountDeletionRequestRepository.save(request);
        return toResponse(request);
    }

    @Transactional(readOnly = true)
    public AccountDeletionRequestResponse getMine(Long userId) {
        return accountDeletionRequestRepository.findByUserId(userId)
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional
    public void cancel(Long userId) {
        accountDeletionRequestRepository.findByUserId(userId)
                .ifPresent(accountDeletionRequestRepository::delete);
    }

    @Transactional(readOnly = true)
    public List<AccountDeletionRequestResponse> listPending() {
        return accountDeletionRequestRepository
                .findByStatusOrderByCreatedAtAsc(AccountDeletionRequestStatus.PENDING)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Removes the request row first so it never dangles once the account it
    // points to is gone, then deletes the account itself. Both happen in one
    // transaction, so a failure partway through (e.g. justDelete rejecting an
    // unexpected target) rolls back the request removal too, instead of
    // silently losing the request with the account still intact.
    @Transactional
    public void approve(Long requestId, Long actingAdminId) {
        AccountDeletionRequest request = findRequest(requestId);
        assertPending(request);

        Long userId = request.getUser().getId();
        accountDeletionRequestRepository.delete(request);
        adminUserService.justDelete(userId, actingAdminId);
    }

    @Transactional
    public AccountDeletionRequestResponse reject(Long requestId, String reason) {
        AccountDeletionRequest request = findRequest(requestId);
        assertPending(request);

        request.setStatus(AccountDeletionRequestStatus.REJECTED);
        request.setAdminNote(reason);
        request.setResolvedAt(LocalDateTime.now());
        return toResponse(request);
    }

    private void assertPending(AccountDeletionRequest request) {
        if (request.getStatus() != AccountDeletionRequestStatus.PENDING) {
            throw new InvalidRequestException("This request has already been resolved");
        }
    }

    private AccountDeletionRequest findRequest(Long id) {
        return accountDeletionRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deletion request not found with id: " + id));
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private AccountDeletionRequestResponse toResponse(AccountDeletionRequest request) {
        User user = request.getUser();
        return AccountDeletionRequestResponse.builder()
                .id(request.getId())
                .userId(user.getId())
                .userName(user.getName())
                .userEmail(user.getEmail())
                .role(user.getRole())
                .reason(request.getReason())
                .status(request.getStatus())
                .adminNote(request.getAdminNote())
                .createdAt(request.getCreatedAt())
                .resolvedAt(request.getResolvedAt())
                .build();
    }
}
