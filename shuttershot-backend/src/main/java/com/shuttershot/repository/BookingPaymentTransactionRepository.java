package com.shuttershot.repository;

import com.shuttershot.model.BookingPaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BookingPaymentTransactionRepository extends JpaRepository<BookingPaymentTransaction, Long> {

    Optional<BookingPaymentTransaction> findByTranId(String tranId);
}
