package com.shuttershot.repository;

import com.shuttershot.model.PhotographerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface PhotographerProfileRepository
        extends JpaRepository<PhotographerProfile, Long>, JpaSpecificationExecutor<PhotographerProfile> {

    Optional<PhotographerProfile> findByUserId(Long userId);
}
