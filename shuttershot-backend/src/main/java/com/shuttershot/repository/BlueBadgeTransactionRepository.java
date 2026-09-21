package com.shuttershot.repository;

import com.shuttershot.model.BlueBadgeTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BlueBadgeTransactionRepository extends JpaRepository<BlueBadgeTransaction, Long> {

    Optional<BlueBadgeTransaction> findByTranId(String tranId);
}
