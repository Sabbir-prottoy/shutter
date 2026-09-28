package com.shuttershot.repository;

import com.shuttershot.model.AccountDeletionRequest;
import com.shuttershot.model.AccountDeletionRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountDeletionRequestRepository extends JpaRepository<AccountDeletionRequest, Long> {

    Optional<AccountDeletionRequest> findByUserId(Long userId);

    List<AccountDeletionRequest> findByStatusOrderByCreatedAtAsc(AccountDeletionRequestStatus status);
}
