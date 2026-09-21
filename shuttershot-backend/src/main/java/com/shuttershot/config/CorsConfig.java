package com.shuttershot.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        // SSLCommerz's hosted checkout page submits a plain HTML form POST straight
        // back to these callback URLs from its own origin (sandbox.sslcommerz.com, or
        // the live gateway's domain in production) — it's a full-page browser
        // navigation, not our frontend making an XHR/fetch call, so the localhost-only
        // policy below doesn't apply. This must be registered before the "/**" pattern
        // — UrlBasedCorsConfigurationSource matches patterns in registration order and
        // uses the first match.
        CorsConfiguration paymentCallback = new CorsConfiguration();
        paymentCallback.setAllowedOriginPatterns(List.of("*"));
        paymentCallback.setAllowedMethods(List.of("GET", "POST"));
        paymentCallback.setAllowedHeaders(List.of("*"));
        source.registerCorsConfiguration("/api/blue-badge/payment/**", paymentCallback);
        source.registerCorsConfiguration("/api/bookings/payment/**", paymentCallback);

        CorsConfiguration configuration = new CorsConfiguration();
        // Vite falls back to the next free port when 5173 is taken, so allow any local
        // dev port rather than a single hardcoded one.
        configuration.setAllowedOriginPatterns(List.of("http://localhost:*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
