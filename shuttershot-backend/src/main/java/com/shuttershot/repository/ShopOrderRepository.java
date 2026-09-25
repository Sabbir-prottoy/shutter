package com.shuttershot.repository;

import com.shuttershot.model.OrderStatus;
import com.shuttershot.model.ShopOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.shuttershot.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ShopOrderRepository extends JpaRepository<ShopOrder, Long> {

    Page<ShopOrder> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<ShopOrder> findByStatusOrderByCreatedAtDesc(OrderStatus status, Pageable pageable);

    Optional<ShopOrder> findByTranId(String tranId);

    // Online orders whose customer never finished paying.
    List<ShopOrder> findByPaymentStatusAndCreatedAtBefore(PaymentStatus paymentStatus, LocalDateTime before);
}
