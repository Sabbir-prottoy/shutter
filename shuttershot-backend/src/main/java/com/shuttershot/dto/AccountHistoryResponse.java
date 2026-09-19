package com.shuttershot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

// Shared by "Photographers Profile History" and "User Profile History" —
// same fields either way, just scoped to a different role by whichever
// AdminUserService method built it.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountHistoryResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private String location;

    // The account's current password, kept in sync on every change —
    // main-admin-only.
    private String password;

    private LocalDateTime joinedAt;
}
