package com.shuttershot.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

// Hibernate's schema "update" adds new tables and columns but never edits a check
// constraint that already exists. The shop_orders payment_method column was created
// when cash on delivery was the only value, so its constraint would reject the new
// SSLCOMMERZ value. This drops that one obsolete constraint; it does nothing on a
// database that never had it.
@Component
@Order(0)
@RequiredArgsConstructor
public class ShopSchemaUpdater implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ShopSchemaUpdater.class);

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("ALTER TABLE shop_orders DROP CONSTRAINT IF EXISTS shop_orders_payment_method_check");
        } catch (Exception ex) {
            log.warn("Could not relax the shop_orders payment_method constraint: {}", ex.getMessage());
        }
    }
}
