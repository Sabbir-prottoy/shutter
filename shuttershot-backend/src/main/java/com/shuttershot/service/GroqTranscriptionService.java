package com.shuttershot.service;

import com.shuttershot.exception.InvalidRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;

/**
 * Turns a recorded clip from the "Speak with AI" page into text using Groq's
 * Whisper endpoint.
 *
 * <p>Transcribing server-side rather than with the browser's SpeechRecognition
 * API means the microphone works in every browser, not just the Chromium ones
 * that implement it. It also draws on a separate quota — audio-seconds per
 * hour, rather than the chat completions' tokens per minute — so speaking does
 * not eat into the budget the replies need.
 */
@Slf4j
@Service
public class GroqTranscriptionService {

    private static final RestClient CLIENT = RestClient.create("https://api.groq.com");

    @Value("${groq.api-key}")
    private String apiKey;

    @Value("${groq.transcription-model}")
    private String model;

    public String transcribe(byte[] audio, String filename) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new InvalidRequestException("Voice chat isn't set up yet — no Groq API key is configured.");
        }
        if (audio == null || audio.length == 0) {
            throw new InvalidRequestException("No audio was recorded. Please try again.");
        }

        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("file", new ByteArrayResource(audio) {
            @Override
            public String getFilename() {
                // Whisper picks its decoder from the extension, so the browser's
                // container type has to survive the hop through our API.
                return filename;
            }
        });
        form.add("model", model);
        form.add("response_format", "json");

        try {
            Map<String, Object> response = CLIENT.post()
                    .uri("/openai/v1/audio/transcriptions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(form)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });

            Object text = response == null ? null : response.get("text");
            return text == null ? "" : text.toString().trim();
        } catch (HttpClientErrorException.TooManyRequests ex) {
            log.warn("Groq transcription rate limit hit", ex);
            throw new InvalidRequestException(
                    "Too much audio has been transcribed recently. Please wait a moment and try again.");
        } catch (RestClientException ex) {
            log.warn("Groq transcription failed", ex);
            throw new InvalidRequestException("We couldn't make out that recording. Please try again.");
        }
    }
}
