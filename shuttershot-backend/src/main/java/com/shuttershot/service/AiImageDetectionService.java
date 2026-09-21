package com.shuttershot.service;

import com.shuttershot.exception.InvalidRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;

// Thin client for the AI or Not image-detection API (https://aiornot.com) —
// admin-triggered, on demand, for a single portfolio photo at a time (never
// run automatically on upload, since it's a paid external call). Parses the
// response as raw nested maps rather than typed DTOs, same convention as
// SSLCommerzService/OtpService's Textbelt call, since the schema is a third
// party's and explicitly documented as not exhaustive (new generators can
// appear without notice).
@Service
public class AiImageDetectionService {

    private static final Logger log = LoggerFactory.getLogger(AiImageDetectionService.class);
    private static final RestClient CLIENT = RestClient.create("https://api.aiornot.com");

    @Value("${aiornot.api-key}")
    private String apiKey;

    public record AiCheckResult(String verdict, Double confidence, String generator) {
    }

    public AiCheckResult check(byte[] imageBytes, String filename) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new InvalidRequestException("AI detection isn't configured (missing AIORNOT_API_KEY)");
        }

        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("image", new ByteArrayResource(imageBytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        });

        Map<String, Object> response;
        try {
            response = CLIENT.post()
                    .uri("/v2/image/sync")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(form)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });
        } catch (RestClientException ex) {
            log.warn("AI or Not request failed", ex);
            throw new InvalidRequestException("Could not reach the AI detection service. Please try again.");
        }

        return parse(response);
    }

    @SuppressWarnings("unchecked")
    private AiCheckResult parse(Map<String, Object> response) {
        Map<String, Object> report = asMap(response.get("report"));
        Map<String, Object> aiGenerated = asMap(report.get("ai_generated"));

        String verdict = aiGenerated.get("verdict") instanceof String s ? s : "unknown";

        Map<String, Object> aiBlock = asMap(aiGenerated.get("ai"));
        Double confidence = aiBlock.get("confidence") instanceof Number n ? n.doubleValue() : null;

        String bestGenerator = null;
        double bestConfidence = -1;
        for (Map.Entry<String, Object> entry : asMap(aiGenerated.get("generator")).entrySet()) {
            // The "generator" map also mirrors the top-level ai/human verdict
            // under those same two keys — not real generator names, skip them.
            if (entry.getKey().equals("ai") || entry.getKey().equals("human")) {
                continue;
            }
            Map<String, Object> generatorBlock = asMap(entry.getValue());
            boolean detected = Boolean.TRUE.equals(generatorBlock.get("is_detected"));
            double generatorConfidence = generatorBlock.get("confidence") instanceof Number n ? n.doubleValue() : 0;
            if (detected && generatorConfidence > bestConfidence) {
                bestConfidence = generatorConfidence;
                bestGenerator = displayName(entry.getKey());
            }
        }

        return new AiCheckResult(verdict, confidence, bestGenerator);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object value) {
        return value instanceof Map ? (Map<String, Object>) value : Map.of();
    }

    // The API's own docs note this generator list "is not exhaustive" — new
    // ones can appear without notice, so unrecognized keys fall back to a
    // readable guess rather than being dropped.
    private static String displayName(String key) {
        return switch (key) {
            case "midjourney" -> "Midjourney";
            case "dall_e" -> "DALL·E";
            case "stable_diffusion" -> "Stable Diffusion";
            case "this_person_does_not_exist" -> "This Person Does Not Exist";
            case "adobe_firefly" -> "Adobe Firefly";
            case "flux" -> "Flux";
            case "four_o" -> "GPT-4o (ChatGPT image)";
            case "nano_banana" -> "Nano Banana (Gemini)";
            default -> titleCase(key);
        };
    }

    private static String titleCase(String key) {
        String[] words = key.split("_");
        StringBuilder sb = new StringBuilder();
        for (String word : words) {
            if (word.isEmpty()) continue;
            if (!sb.isEmpty()) sb.append(' ');
            sb.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1));
        }
        return sb.toString();
    }
}
