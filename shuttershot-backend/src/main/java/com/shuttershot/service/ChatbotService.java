package com.shuttershot.service;

import com.shuttershot.dto.AvailabilityResponse;
import com.shuttershot.dto.ChatMessage;
import com.shuttershot.dto.PackageResponse;
import com.shuttershot.dto.PhotographerSummaryResponse;
import com.shuttershot.model.AvailabilityStatus;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Grounds every answer in the site's own live data rather than letting the
 * model improvise: each request rebuilds a fresh text summary of every
 * photographer, their packages, and their near-term availability, and sends
 * it as the systemInstruction alongside the conversation. No server-side
 * session — the frontend resends the running history each turn.
 */
@Service
@RequiredArgsConstructor
public class ChatbotService {

    private static final Logger log = LoggerFactory.getLogger(ChatbotService.class);
    private static final RestClient GEMINI_CLIENT = RestClient.create("https://generativelanguage.googleapis.com");

    private final PhotographerService photographerService;
    private final PackageService packageService;
    private final AvailabilityService availabilityService;

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String model;

    public String ask(String message, List<ChatMessage> history) {
        if (apiKey == null || apiKey.isBlank()) {
            return "The chat assistant isn't set up yet — an admin needs to configure a Gemini API key.";
        }

        List<Map<String, Object>> contents = new ArrayList<>();
        if (history != null) {
            for (ChatMessage turn : history) {
                contents.add(Map.of(
                        "role", turn.getRole(),
                        "parts", List.of(Map.of("text", turn.getText()))
                ));
            }
        }
        contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", message))));

        Map<String, Object> body = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", buildContext()))),
                "contents", contents
        );

        try {
            Map<String, Object> response = GEMINI_CLIENT.post()
                    .uri("/v1beta/models/{model}:generateContent", model)
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });

            return extractReply(response);
        } catch (RestClientException ex) {
            log.warn("Gemini request failed", ex);
            return "Sorry, I'm having trouble answering right now. Please try again in a moment.";
        }
    }

    private String buildContext() {
        StringBuilder sb = new StringBuilder();
        sb.append("You are the ShutterShot Assistant, a helpful chatbot on the ShutterShot ")
                .append("photographer-booking website. Answer questions about photographers, their ")
                .append("locations, specialties, packages, pricing, and date availability using ONLY ")
                .append("the data below — never invent a photographer, price, or date that isn't listed. ")
                .append("If asked something this data doesn't cover, say so and suggest checking the ")
                .append("photographer's profile page directly. Keep answers short and friendly. ")
                .append("If someone wants to actually book, point them to the photographer's profile ")
                .append("page and the \"Book\" button there.\n\n")
                .append("Current photographers on ShutterShot:\n");

        List<PhotographerSummaryResponse> photographers = photographerService.search(null, null);
        if (photographers.isEmpty()) {
            sb.append("(No photographers are listed on the site yet.)\n");
            return sb.toString();
        }

        for (PhotographerSummaryResponse photographer : photographers) {
            sb.append("- ").append(photographer.getName())
                    .append(" (photographer id ").append(photographer.getId()).append(")")
                    .append(", location: ")
                    .append(blankToPlaceholder(photographer.getBaseLocation(), "not listed"))
                    .append(", specialties: ")
                    .append(photographer.getSpecialties() == null || photographer.getSpecialties().isEmpty()
                            ? "none listed" : String.join(", ", photographer.getSpecialties()))
                    .append(", experience: ")
                    .append(photographer.getYearsExperience() == null
                            ? "not listed" : photographer.getYearsExperience() + " years")
                    .append(", rating: ").append(photographer.getRatingAvg())
                    .append(" (").append(photographer.getTotalReviews()).append(" reviews)")
                    .append(photographer.isVerified() ? ", verified" : ", not yet verified")
                    .append("\n");

            List<PackageResponse> packages = packageService.listByPhotographer(photographer.getId());
            if (packages.isEmpty()) {
                sb.append("  Packages: none listed yet\n");
            } else {
                for (PackageResponse pkg : packages) {
                    sb.append("  Package: \"").append(pkg.getTitle()).append("\" — $")
                            .append(pkg.getPrice())
                            .append(" (").append(pkg.getDurationHours()).append("h session, delivered in ")
                            .append(pkg.getDeliveryDays()).append(" days)\n");
                }
            }

            List<AvailabilityResponse> availability = availabilityService.getAvailability(
                    photographer.getId(), null, null);
            List<String> unavailable = availability.stream()
                    .filter(a -> a.getStatus() != AvailabilityStatus.FREE)
                    .map(a -> a.getDate() + " (" + a.getStatus() + ")")
                    .toList();
            if (unavailable.isEmpty()) {
                sb.append("  Availability: fully open for the next 30 days\n");
            } else {
                sb.append("  Unavailable in the next 30 days: ").append(String.join(", ", unavailable))
                        .append(" — any other date in that window is open\n");
            }
        }

        return sb.toString();
    }

    private String blankToPlaceholder(String value, String placeholder) {
        return (value == null || value.isBlank()) ? placeholder : value;
    }

    @SuppressWarnings("unchecked")
    private String extractReply(Map<String, Object> response) {
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            String text = (String) parts.get(0).get("text");
            return text != null ? text : "Sorry, I couldn't come up with an answer for that.";
        } catch (RuntimeException ex) {
            log.warn("Unexpected Gemini response shape: {}", response, ex);
            return "Sorry, I couldn't come up with an answer for that.";
        }
    }
}
