package com.shuttershot.repository;

import com.shuttershot.model.BlueBadge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BlueBadgeRepository extends JpaRepository<BlueBadge, Long> {

    Optional<BlueBadge> findByPhotographerId(Long photographerId);

    List<BlueBadge> findByActiveTrue();

    long countByActiveTrue();
}
