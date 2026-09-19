package com.shuttershot.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

// A permanent record that outlives the banned account itself — the account
// row is deleted by AdminUserService.ban, but this row stays behind so the
// same email can never register a new account again. See AdminUserService's
// justDelete(), which does NOT create one of these, for the alternative that
// leaves the email free to sign up again.
@Entity
@Table(name = "banned_emails")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BannedEmail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @CreationTimestamp
    @Column(name = "banned_at", nullable = false, updatable = false)
    private LocalDateTime bannedAt;
}
