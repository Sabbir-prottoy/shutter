package com.shuttershot.service;

import com.shuttershot.dto.BlueBadgeHolderResponse;
import com.shuttershot.dto.BlueBadgePurchaseInitResponse;
import com.shuttershot.dto.BlueBadgeStatusResponse;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.BlueBadge;
import com.shuttershot.model.BlueBadgeSettings;
import com.shuttershot.model.BlueBadgeTransaction;
import com.shuttershot.model.BlueBadgeTransactionStatus;
import com.shuttershot.model.PhotographerProfile;
import com.shuttershot.repository.BlueBadgeRepository;
import com.shuttershot.repository.BlueBadgeSettingsRepository;
import com.shuttershot.repository.BlueBadgeTransactionRepository;
import com.shuttershot.repository.PhotographerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

// The blue (verified) badge: a photographer pays (via SSLCommerz, in BDT) to
// have it, which puts their profile at the top of public search results and
// marks them as premium-support. initiatePurchase() only opens a checkout
// session — the badge itself is granted in confirmPayment(), which runs after
// SSLCommerz's validation API confirms the payment server-side. Never grant
// the badge from the success_url redirect alone; that's just a browser hop
// the customer's own browser makes and proves nothing by itself.
@Service
@RequiredArgsConstructor
public class BlueBadgeService {

    private static final Logger log = LoggerFactory.getLogger(BlueBadgeService.class);
    private static final Long SETTINGS_ID = 1L;
    private static final BigDecimal DEFAULT_PRICE = new BigDecimal("500.00");

    private final BlueBadgeRepository blueBadgeRepository;
    private final BlueBadgeSettingsRepository blueBadgeSettingsRepository;
    private final BlueBadgeTransactionRepository blueBadgeTransactionRepository;
    private final PhotographerProfileRepository photographerProfileRepository;
    private final MainAdminGuard mainAdminGuard;
    private final SSLCommerzService sslCommerzService;

    @Value("${app.base-url}")
    private String backendBaseUrl;

    @Value("${app.frontend-url}")
    private String frontendBaseUrl;

    @Transactional(readOnly = true)
    public BlueBadgeStatusResponse getStatus(Long authenticatedUserId) {
        PhotographerProfile profile = findOwnProfile(authenticatedUserId);
        BigDecimal currentPrice = getOrCreateSettings().getPrice();

        return blueBadgeRepository.findByPhotographerId(profile.getId())
                .filter(BlueBadge::isActive)
                .map(badge -> BlueBadgeStatusResponse.builder()
                        .currentPrice(currentPrice)
                        .hasBadge(true)
                        .amountPaid(badge.getAmountPaid())
                        .purchasedAt(badge.getPurchasedAt())
                        .build())
                .orElseGet(() -> BlueBadgeStatusResponse.builder()
                        .currentPrice(currentPrice)
                        .hasBadge(false)
                        .build());
    }

    @Transactional
    public BlueBadgePurchaseInitResponse initiatePurchase(Long authenticatedUserId) {
        PhotographerProfile profile = findOwnProfile(authenticatedUserId);
        BigDecimal price = getOrCreateSettings().getPrice();
        var user = profile.getUser();

        String tranId = "BADGE" + profile.getId() + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);

        BlueBadgeTransaction transaction = BlueBadgeTransaction.builder()
                .tranId(tranId)
                .photographer(profile)
                .amount(price)
                .currency("BDT")
                .status(BlueBadgeTransactionStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
        blueBadgeTransactionRepository.save(transaction);

        String gatewayUrl = sslCommerzService.initiateSession(
                price,
                tranId,
                backendBaseUrl + "/api/blue-badge/payment/success",
                backendBaseUrl + "/api/blue-badge/payment/fail",
                backendBaseUrl + "/api/blue-badge/payment/cancel",
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getLocation() != null ? user.getLocation() : profile.getBaseLocation());

        return BlueBadgePurchaseInitResponse.builder().gatewayUrl(gatewayUrl).build();
    }

    // Called from the success_url callback. Re-validates the payment against
    // SSLCommerz's own validation API before granting anything — idempotent,
    // so a duplicate/retried callback for an already-VALID transaction is a
    // harmless no-op rather than double-charging the badge record.
    @Transactional
    public boolean confirmPayment(String tranId, String valId) {
        BlueBadgeTransaction transaction = blueBadgeTransactionRepository.findByTranId(tranId).orElse(null);
        if (transaction == null) {
            log.warn("SSLCommerz success callback for unknown tran_id {}", tranId);
            return false;
        }
        if (transaction.getStatus() == BlueBadgeTransactionStatus.VALID) {
            return true;
        }

        boolean valid = sslCommerzService.validateTransaction(valId, transaction.getAmount());
        if (!valid) {
            transaction.setStatus(BlueBadgeTransactionStatus.FAILED);
            return false;
        }

        transaction.setStatus(BlueBadgeTransactionStatus.VALID);
        transaction.setValidatedAt(LocalDateTime.now());

        PhotographerProfile profile = transaction.getPhotographer();
        BlueBadge badge = blueBadgeRepository.findByPhotographerId(profile.getId())
                .orElseGet(() -> BlueBadge.builder().photographer(profile).build());
        badge.setAmountPaid(transaction.getAmount());
        badge.setPurchasedAt(LocalDateTime.now());
        badge.setActive(true);
        blueBadgeRepository.save(badge);

        profile.setHasBlueBadge(true);
        return true;
    }

    @Transactional
    public void markFailed(String tranId) {
        blueBadgeTransactionRepository.findByTranId(tranId)
                .filter(t -> t.getStatus() == BlueBadgeTransactionStatus.PENDING)
                .ifPresent(t -> t.setStatus(BlueBadgeTransactionStatus.FAILED));
    }

    @Transactional
    public void markCancelled(String tranId) {
        blueBadgeTransactionRepository.findByTranId(tranId)
                .filter(t -> t.getStatus() == BlueBadgeTransactionStatus.PENDING)
                .ifPresent(t -> t.setStatus(BlueBadgeTransactionStatus.CANCELLED));
    }

    public String frontendReturnUrl(String paymentResult) {
        return frontendBaseUrl + "/dashboard/verified-badge?payment=" + paymentResult;
    }

    @Transactional(readOnly = true)
    public BigDecimal getCurrentPriceForAdmin(Long actingAdminId) {
        mainAdminGuard.require(actingAdminId, "view the blue badge price");
        return getOrCreateSettings().getPrice();
    }

    @Transactional
    public BigDecimal updatePrice(BigDecimal newPrice, Long actingAdminId) {
        mainAdminGuard.require(actingAdminId, "change the blue badge price");

        BlueBadgeSettings settings = getOrCreateSettings();
        settings.setPrice(newPrice);
        settings.setUpdatedAt(LocalDateTime.now());
        return blueBadgeSettingsRepository.save(settings).getPrice();
    }

    @Transactional(readOnly = true)
    public List<BlueBadgeHolderResponse> listHolders(Long actingAdminId) {
        mainAdminGuard.require(actingAdminId, "view blue badge holders");

        return blueBadgeRepository.findByActiveTrue().stream()
                .sorted(Comparator.comparing(b -> b.getPhotographer().getUser().getName(), String.CASE_INSENSITIVE_ORDER))
                .map(this::toHolderResponse)
                .toList();
    }

    @Transactional
    public void revoke(Long photographerUserId, Long actingAdminId) {
        mainAdminGuard.require(actingAdminId, "revoke blue badges");

        PhotographerProfile profile = photographerProfileRepository.findByUserId(photographerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Photographer not found"));

        blueBadgeRepository.findByPhotographerId(profile.getId()).ifPresent(badge -> {
            badge.setActive(false);
            blueBadgeRepository.save(badge);
        });
        profile.setHasBlueBadge(false);
    }

    private BlueBadgeSettings getOrCreateSettings() {
        return blueBadgeSettingsRepository.findById(SETTINGS_ID)
                .orElseGet(() -> blueBadgeSettingsRepository.save(
                        BlueBadgeSettings.builder()
                                .id(SETTINGS_ID)
                                .price(DEFAULT_PRICE)
                                .updatedAt(LocalDateTime.now())
                                .build()));
    }

    private PhotographerProfile findOwnProfile(Long authenticatedUserId) {
        return photographerProfileRepository.findByUserId(authenticatedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Photographer profile not found for current user"));
    }

    private BlueBadgeHolderResponse toHolderResponse(BlueBadge badge) {
        var user = badge.getPhotographer().getUser();
        return BlueBadgeHolderResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .location(user.getLocation())
                .amountPaid(badge.getAmountPaid())
                .purchasedAt(badge.getPurchasedAt())
                .build();
    }
}
