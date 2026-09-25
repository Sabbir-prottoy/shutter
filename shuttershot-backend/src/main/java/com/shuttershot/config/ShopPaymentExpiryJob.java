package com.shuttershot.config;

import com.shuttershot.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

// Releases the stock held by online orders whose customer walked away from the
// payment page: they are cancelled once the payment window has passed.
@Configuration
@EnableScheduling
@RequiredArgsConstructor
public class ShopPaymentExpiryJob {

    private final OrderService orderService;

    @Scheduled(initialDelay = 120_000, fixedDelay = 600_000)
    public void releaseAbandonedPayments() {
        orderService.expireStalePayments();
    }
}
