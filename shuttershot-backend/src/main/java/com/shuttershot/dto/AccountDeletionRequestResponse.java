package com.shuttershot.dto;

import com.shuttershot.model.AccountDeletionRequestStatus;
import com.shuttershot.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountDeletionRequestResponse {

    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private Role role;
    private String reason;
    private AccountDeletionRequestStatus status;
    private String adminNote;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}
