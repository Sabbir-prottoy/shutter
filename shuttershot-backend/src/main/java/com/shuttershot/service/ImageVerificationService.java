package com.shuttershot.service;

import com.drew.imaging.ImageMetadataReader;
import com.drew.imaging.ImageProcessingException;
import com.drew.metadata.Directory;
import com.drew.metadata.Metadata;
import com.drew.metadata.Tag;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Every upload goes to an admin queue regardless of what this finds — this
 * service only produces a note to help the admin decide, it no longer makes
 * the go-live decision itself. The signal is EXIF presence: genuine
 * camera/device metadata suggests an original photo, while missing or
 * unreadable metadata is a common trait of screenshots, downloaded stock
 * photos, or AI-generated images, so it's called out for closer review.
 * Reverse-image-search is a stretch goal and not implemented here.
 */
@Service
@RequiredArgsConstructor
public class ImageVerificationService {

    private final ObjectMapper objectMapper;

    public record VerificationResult(String note, String exifDataJson) {
    }

    public VerificationResult verify(MultipartFile file) {
        try (InputStream inputStream = file.getInputStream()) {
            Metadata metadata = ImageMetadataReader.readMetadata(inputStream);

            ExifIFD0Directory ifd0 = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
            ExifSubIFDDirectory subIfd = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class);

            if (ifd0 == null && subIfd == null) {
                return new VerificationResult(
                        "No camera metadata found in this image — it may be a screenshot, a "
                                + "downloaded photo, or AI-generated. Review carefully before approving.",
                        null
                );
            }

            Map<String, String> exifTags = new LinkedHashMap<>();
            for (Directory directory : metadata.getDirectories()) {
                for (Tag tag : directory.getTags()) {
                    exifTags.put(directory.getName() + " - " + tag.getTagName(), tag.getDescription());
                }
            }

            return new VerificationResult(
                    "Camera metadata found — this looks like an original photo from a camera or phone.",
                    objectMapper.writeValueAsString(exifTags)
            );
        } catch (ImageProcessingException | IOException e) {
            return new VerificationResult(
                    "Could not read this image's metadata (" + e.getMessage() + ") — review carefully before approving.",
                    null
            );
        }
    }
}
