package com.shuttershot.repository;

import com.shuttershot.model.BannedEmail;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BannedEmailRepository extends JpaRepository<BannedEmail, Long> {

    boolean existsByEmailIgnoreCase(String email);
}
