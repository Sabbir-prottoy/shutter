package com.shuttershot.service;

import com.drew.imaging.ImageMetadataReader;
import com.drew.imaging.ImageProcessingException;
import com.drew.metadata.Directory;
import com.drew.metadata.Metadata;
import com.drew.metadata.Tag;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuttershot.model.VerificationStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Minimum-bar image verification: an upload is VERIFIED when it carries genuine
 * camera/device EXIF data, and FLAGGED (for admin review) when that data is absent
 * or unreadable — e.g. screenshots, stock photos, or images stripped of metadata.
 * Reverse-image-search is a stretch goal and not implemented here.
 */
@Service
@RequiredArgsConstructor
public class ImageVerificationService {

    private final ObjectMapper objectMapper;

    public record VerificationResult(VerificationStatus status, String flagReason, String exifDataJson) {
    }

    public VerificationResult verify(MultipartFile file) {
        try (InputStream inputStream = file.getInputStream()) {
            Metadata metadata = ImageMetadataReader.readMetadata(inputStream);

            ExifIFD0Directory ifd0 = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
            ExifSubIFDDirectory subIfd = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class);

            if (ifd0 == null && subIfd == null) {
                return new VerificationResult(
                        VerificationStatus.FLAGGED,
                        "Missing EXIF metadata: no camera/device information found in the image",
                        null
                );
            }

            Map<String, String> exifTags = new LinkedHashMap<>();
            for (Directory directory : metadata.getDirectories()) {
                for (Tag tag : directory.getTags()) {
                    exifTags.put(directory.getName() + " - " + tag.getTagName(), tag.getDescription());
                }
            }

            return new VerificationResult(VerificationStatus.VERIFIED, null, objectMapper.writeValueAsString(exifTags));
        } catch (ImageProcessingException | IOException e) {
            return new VerificationResult(
                    VerificationStatus.FLAGGED,
                    "Unable to read image metadata: " + e.getMessage(),
                    null
            );
        }
    }
}
