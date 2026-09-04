package com.shuttershot.service;

import com.shuttershot.exception.FileStorageException;
import com.shuttershot.exception.InvalidFileException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.upload-dir}")
    private String uploadDir;

    @Value("${app.base-url}")
    private String baseUrl;

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("Uploaded file must not be empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new InvalidFileException("Only image files are allowed");
        }

        try {
            String originalFilename = StringUtils.cleanPath(
                    file.getOriginalFilename() == null ? "image" : file.getOriginalFilename());
            String extension = "";
            int dotIndex = originalFilename.lastIndexOf('.');
            if (dotIndex >= 0) {
                extension = originalFilename.substring(dotIndex);
            }
            String storedFilename = UUID.randomUUID() + extension;

            Path targetDir = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(targetDir);
            Path targetPath = targetDir.resolve(storedFilename);
            file.transferTo(targetPath);

            return baseUrl + "/uploads/" + storedFilename;
        } catch (IOException e) {
            throw new FileStorageException("Failed to store uploaded file", e);
        }
    }

    public void delete(String imageUrl) {
        if (imageUrl == null || !imageUrl.contains("/uploads/")) {
            return;
        }
        String filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
        Path targetPath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(filename);
        try {
            Files.deleteIfExists(targetPath);
        } catch (IOException e) {
            throw new FileStorageException("Failed to delete stored file", e);
        }
    }
}
