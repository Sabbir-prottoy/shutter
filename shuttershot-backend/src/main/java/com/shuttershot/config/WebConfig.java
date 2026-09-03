package com.shuttershot.config;

import com.shuttershot.exception.FileStorageException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            // The resource handler resolves its location once at startup; if this
            // directory doesn't exist yet, files uploaded afterward 404/500 until
            // the app restarts. Create it eagerly so a fresh deployment works.
            Files.createDirectories(uploadPath);
        } catch (IOException e) {
            throw new FileStorageException("Failed to create upload directory: " + uploadPath, e);
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPath.toUri().toString());
    }
}
