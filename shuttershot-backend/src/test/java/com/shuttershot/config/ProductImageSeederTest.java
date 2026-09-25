package com.shuttershot.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuttershot.model.Product;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

// Guards the bundled sample photos: every starting product must have a real image file
// and a credit, since the photos are used under licences that require attribution.
class ProductImageSeederTest {

    private static List<ProductImageSeeder.Entry> index() throws Exception {
        try (InputStream in = new ClassPathResource(ProductImageSeeder.INDEX_FILE).getInputStream()) {
            return new ObjectMapper().readValue(in, new TypeReference<>() {
            });
        }
    }

    // No freely licensed photo of these could be found, so they keep their drawn
    // illustration until an admin uploads a photo in Manage Products.
    private static final Set<String> WITHOUT_PHOTO = Set.of(
            "Universal L-Bracket", "Camera Bean Bag (Pre-filled)", "Padded Tripod Carry Strap");

    @Test
    void everyStartingProductHasOneSamplePhotoExceptTheKnownFew() throws Exception {
        Set<String> productNames = new HashSet<>();
        for (Product product : ProductSeeder.catalogue()) {
            productNames.add(product.getName());
        }

        Set<String> indexed = new HashSet<>();
        for (ProductImageSeeder.Entry entry : index()) {
            assertTrue(indexed.add(entry.name()), "duplicate entry for " + entry.name());
        }

        Set<String> covered = new HashSet<>(indexed);
        covered.addAll(WITHOUT_PHOTO);
        assertEquals(productNames, covered);
        assertTrue(indexed.stream().noneMatch(WITHOUT_PHOTO::contains));
    }

    @Test
    void everyPhotoFileExistsIsAJpegOfSensibleSizeAndHasACredit() throws Exception {
        Set<String> files = new HashSet<>();
        for (ProductImageSeeder.Entry entry : index()) {
            assertTrue(files.add(entry.file()), "file used twice: " + entry.file());

            ClassPathResource photo = new ClassPathResource(ProductImageSeeder.IMAGE_DIR + entry.file());
            assertTrue(photo.exists(), "missing file for " + entry.name());

            byte[] bytes;
            try (InputStream in = photo.getInputStream()) {
                bytes = in.readAllBytes();
            }
            assertTrue(bytes.length > 5_000 && bytes.length < 600_000,
                    entry.name() + " photo is " + bytes.length + " bytes");
            assertTrue((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8, entry.name() + " is not a JPEG");

            assertTrue(entry.credit() != null && entry.credit().length() > 5, entry.name() + " needs a credit");
            assertTrue(entry.credit().length() <= 400, entry.name() + " credit too long");
            assertTrue(entry.source() != null && entry.source().startsWith("https://commons.wikimedia.org/"),
                    entry.name() + " needs its source page");
            assertTrue(entry.source().length() <= 400, entry.name() + " source too long");
        }
    }
}
