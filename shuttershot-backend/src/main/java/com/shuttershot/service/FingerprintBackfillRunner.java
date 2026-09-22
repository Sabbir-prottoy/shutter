package com.shuttershot.service;

import com.shuttershot.model.PortfolioImage;
import com.shuttershot.repository.PortfolioImageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Fingerprints portfolio images uploaded before the duplicate check existed.
 * Without this the check would have nothing to compare a new upload against,
 * so a picture lifted from an older profile would sail through.
 *
 * <p>Runs once in the background after startup — it decodes every unfingerprinted
 * image, so it must not hold up boot, and it is a no-op on every later restart.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FingerprintBackfillRunner implements ApplicationRunner {

    private final PortfolioImageRepository portfolioImageRepository;
    private final ImageFingerprintService imageFingerprintService;
    private final FileStorageService fileStorageService;

    @Override
    @Async
    @Transactional
    public void run(ApplicationArguments args) {
        List<PortfolioImage> pending = portfolioImageRepository.findByContentHashIsNull();
        if (pending.isEmpty()) {
            return;
        }

        log.info("Fingerprinting {} portfolio images for duplicate detection…", pending.size());
        int done = 0;
        int failed = 0;
        for (PortfolioImage image : pending) {
            try {
                byte[] bytes = fileStorageService.loadBytes(image.getImageUrl());
                var fingerprint = imageFingerprintService.fingerprint(bytes);
                if (fingerprint.isEmpty()) {
                    failed++;
                    continue;
                }
                image.setContentHash(fingerprint.get().contentHash());
                image.setPerceptualHash(fingerprint.get().perceptualHash());
                done++;
            } catch (Exception ex) {
                // A missing or unreadable file shouldn't stop the rest.
                failed++;
            }
        }
        portfolioImageRepository.saveAll(pending);
        log.info("Fingerprinting complete — {} images indexed, {} skipped", done, failed);
    }
}
