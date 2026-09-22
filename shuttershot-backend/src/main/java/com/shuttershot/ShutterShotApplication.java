package com.shuttershot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

// Async is enabled so the one-off image-fingerprint backfill can run off the
// startup thread instead of delaying boot (see FingerprintBackfillRunner).
@EnableAsync
@SpringBootApplication
public class ShutterShotApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShutterShotApplication.class, args);
    }
}
