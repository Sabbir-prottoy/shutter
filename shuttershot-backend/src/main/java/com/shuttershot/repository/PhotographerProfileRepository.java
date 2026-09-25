package com.shuttershot.repository;

import com.shuttershot.model.PhotographerProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface PhotographerProfileRepository
        extends JpaRepository<PhotographerProfile, Long>, JpaSpecificationExecutor<PhotographerProfile> {

    Optional<PhotographerProfile> findByUserId(Long userId);

    // LOAD keeps every other attribute at its normal fetch type (specialties stay
    // eager). Search results always read the owning user (name, photo, verified flag),
    // so load it in the same query instead of one extra query per photographer.
    @Override
    @EntityGraph(attributePaths = "user", type = EntityGraph.EntityGraphType.LOAD)
    Page<PhotographerProfile> findAll(Specification<PhotographerProfile> spec, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = "user", type = EntityGraph.EntityGraphType.LOAD)
    List<PhotographerProfile> findAll(Specification<PhotographerProfile> spec, Sort sort);
}
