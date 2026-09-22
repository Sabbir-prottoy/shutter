package com.shuttershot.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Thin client for Groq's OpenAI-compatible chat completions API, used by the
 * full-page AI chat. Parsed as raw maps rather than typed DTOs, the same
 * convention the other third-party clients here follow.
 */
@Slf4j
@Service
public class GroqChatService {

    private static final RestClient CLIENT = RestClient.create("https://api.groq.com");

    // The default model is a reasoning model: it spends tokens thinking before
    // it writes, and that thinking is billed against max_tokens. Too small a
    // budget and the whole allowance goes to reasoning, leaving content empty,
    // so keep this generous and reasoning_effort low.
    // Also capped by the free tier's 8,000 tokens-per-minute budget, which the
    // reply counts against just as the prompt does. 900 is comfortably more
    // than a chat answer needs while leaving room for several messages a minute.
    private static final int MAX_TOKENS = 900;
    private static final String REASONING_EFFORT = "low";

    @Value("${groq.api-key}")
    private String apiKey;

    @Value("${groq.model}")
    private String model;

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * @param systemPrompt grounding instructions
     * @param history      prior turns, each {@code {role, content}} with role "user" or "assistant"
     * @param question     the new user message
     */
    public String ask(String systemPrompt, List<Map<String, String>> history, String question) {
        if (!isConfigured()) {
            return "The chat assistant isn't set up yet — an admin needs to configure a Groq API key.";
        }

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        if (history != null) {
            messages.addAll(history);
        }
        messages.add(Map.of("role", "user", "content", question));

        Map<String, Object> body = Map.of(
                "model", model,
                "messages", messages,
                "max_tokens", MAX_TOKENS,
                "reasoning_effort", REASONING_EFFORT
        );

        try {
            Map<String, Object> response = CLIENT.post()
                    .uri("/openai/v1/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });

            return extractReply(response);
        } catch (HttpClientErrorException.TooManyRequests ex) {
            // The free tier's per-minute token budget. Worth saying plainly
            // rather than as a generic failure, because the fix is just to wait.
            log.warn("Groq rate limit hit", ex);
            return "I'm getting more questions than my current plan allows right now. "
                   + "Please wait about a minute and ask again.";
        } catch (RestClientException ex) {
            log.warn("Groq request failed", ex);
            return "Sorry, I'm having trouble answering right now. Please try again in a moment.";
        }
    }

    @SuppressWarnings("unchecked")
    private String extractReply(Map<String, Object> response) {
        if (response == null) {
            return fallback();
        }
        Object choices = response.get("choices");
        if (!(choices instanceof List<?> list) || list.isEmpty()) {
            return fallback();
        }
        Object first = list.get(0);
        if (!(first instanceof Map<?, ?> choice)) {
            return fallback();
        }
        Object message = ((Map<String, Object>) choice).get("message");
        if (!(message instanceof Map<?, ?> messageMap)) {
            return fallback();
        }

        // Deliberately reads "content" only. Reasoning models also return a
        // "reasoning" field holding their private working-out, which must
        // never be shown to the person chatting.
        Object content = ((Map<String, Object>) messageMap).get("content");
        if (content == null || content.toString().isBlank()) {
            return fallback();
        }
        return content.toString().trim();
    }

    private String fallback() {
        return "Sorry, I couldn't put together an answer for that. Could you try rephrasing?";
    }
}
