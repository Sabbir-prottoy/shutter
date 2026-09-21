package com.shuttershot.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.util.Map;

// Thin client for the SSLCommerz payment gateway (https://developer.sslcommerz.com).
// Two calls only: initiateSession to start a checkout and get a GatewayPageURL to
// redirect the browser to, and validateTransaction to confirm — server-to-server,
// after the fact — that a val_id SSLCommerz handed back really corresponds to a
// completed payment for the expected amount. Business logic (what a valid payment
// unlocks) lives in BlueBadgeService; this class only knows the gateway's wire format.
@Service
public class SSLCommerzService {

    private static final Logger log = LoggerFactory.getLogger(SSLCommerzService.class);

    @Value("${sslcommerz.store-id}")
    private String storeId;

    @Value("${sslcommerz.store-password}")
    private String storePassword;

    @Value("${sslcommerz.sandbox:true}")
    private boolean sandbox;

    public String initiateSession(BigDecimal amount, String tranId, String successUrl, String failUrl,
                                   String cancelUrl, String customerName, String customerEmail,
                                   String customerPhone, String customerAddress) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("store_id", storeId);
        form.add("store_passwd", storePassword);
        form.add("total_amount", amount.toPlainString());
        form.add("currency", "BDT");
        form.add("tran_id", tranId);
        form.add("success_url", successUrl);
        form.add("fail_url", failUrl);
        form.add("cancel_url", cancelUrl);
        form.add("cus_name", blankToFallback(customerName, "ShutterShot Photographer"));
        form.add("cus_email", blankToFallback(customerEmail, "no-reply@shuttershot.local"));
        form.add("cus_add1", blankToFallback(customerAddress, "Not provided"));
        form.add("cus_city", "Dhaka");
        form.add("cus_country", "Bangladesh");
        form.add("cus_phone", blankToFallback(customerPhone, "N/A"));
        form.add("shipping_method", "NO");
        form.add("product_name", "ShutterShot Verified Badge");
        form.add("product_category", "Service");
        form.add("product_profile", "general");
        form.add("num_of_item", "1");

        Map<String, Object> response;
        try {
            response = client().post()
                    .uri("/gwprocess/v4/api.php")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });
        } catch (RestClientException ex) {
            throw new IllegalStateException("Could not reach the SSLCommerz payment gateway", ex);
        }

        if (response == null || !"SUCCESS".equalsIgnoreCase(String.valueOf(response.get("status")))) {
            String reason = response != null ? String.valueOf(response.get("failedreason")) : "no response";
            log.warn("SSLCommerz session init failed for tran {}: {}", tranId, reason);
            throw new IllegalStateException("SSLCommerz could not start a checkout session: " + reason);
        }

        return (String) response.get("GatewayPageURL");
    }

    public boolean validateTransaction(String valId, BigDecimal expectedAmount) {
        if (valId == null || valId.isBlank()) {
            return false;
        }

        Map<String, Object> response;
        try {
            response = client().get()
                    .uri(uriBuilder -> uriBuilder.path("/validator/api/validationserverAPI.php")
                            .queryParam("val_id", valId)
                            .queryParam("store_id", storeId)
                            .queryParam("store_passwd", storePassword)
                            .queryParam("format", "json")
                            .build())
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });
        } catch (RestClientException ex) {
            log.warn("SSLCommerz validation request failed for val_id {}", valId, ex);
            return false;
        }

        if (response == null) {
            return false;
        }

        String status = String.valueOf(response.get("status"));
        boolean statusOk = "VALID".equalsIgnoreCase(status) || "VALIDATED".equalsIgnoreCase(status);
        if (!statusOk) {
            log.warn("SSLCommerz validation for val_id {} returned status {}", valId, status);
            return false;
        }

        Object amountObj = response.get("amount");
        if (amountObj == null) {
            return false;
        }
        BigDecimal paidAmount = new BigDecimal(String.valueOf(amountObj));
        boolean amountOk = paidAmount.subtract(expectedAmount).abs().compareTo(new BigDecimal("0.01")) <= 0;
        if (!amountOk) {
            log.warn("SSLCommerz validation amount mismatch for val_id {}: expected {}, got {}",
                    valId, expectedAmount, paidAmount);
        }
        return amountOk;
    }

    private RestClient client() {
        String base = sandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com";
        return RestClient.create(base);
    }

    private static String blankToFallback(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value;
    }
}
