package com.shuttershot.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuttershot.model.Product;
import com.shuttershot.repository.ProductRepository;
import com.shuttershot.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// Attaches the bundled sample photo (src/main/resources/product-images) to each starting
// product, together with the photographer's credit. It happens once per product: after
// that an admin can replace or remove the photo and a restart will not bring it back.
@Component
@Order(2)
@RequiredArgsConstructor
public class ProductImageSeeder implements ApplicationRunner {

    static final String IMAGE_DIR = "product-images/";
    static final String INDEX_FILE = IMAGE_DIR + "index.json";

    private static final Logger log = LoggerFactory.getLogger(ProductImageSeeder.class);

    private final ProductRepository productRepository;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

    public record Entry(String name, String file, String credit, String source) {
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Map<String, Entry> byName = new HashMap<>();
        for (Entry entry : readIndex()) {
            byName.put(entry.name(), entry);
        }
        if (byName.isEmpty()) {
            return;
        }

        int attached = 0;
        for (Product product : productRepository.findAll()) {
            if (Boolean.TRUE.equals(product.getSampleImageApplied())) {
                continue;
            }
            Entry entry = byName.get(product.getName());
            if (entry == null) {
                continue;
            }

            // A product that already has a photo of its own keeps it.
            if (product.getImageUrl() == null) {
                try (InputStream in = new ClassPathResource(IMAGE_DIR + entry.file()).getInputStream()) {
                    product.setImageUrl(fileStorageService.storeBytes(in.readAllBytes(), ".jpg"));
                    product.setImageCredit(entry.credit());
                    product.setImageSource(entry.source());
                    attached++;
                } catch (IOException ex) {
                    log.warn("Could not attach the sample photo for {}: {}", product.getName(), ex.getMessage());
                    continue;
                }
            }
            product.setSampleImageApplied(true);
        }

        if (attached > 0) {
            log.info("Attached {} sample product photos", attached);
        }
    }

    private List<Entry> readIndex() {
        ClassPathResource index = new ClassPathResource(INDEX_FILE);
        if (!index.exists()) {
            return List.of();
        }
        try (InputStream in = index.getInputStream()) {
            return objectMapper.readValue(in, new TypeReference<List<Entry>>() {
            });
        } catch (IOException ex) {
            log.warn("Could not read {}: {}", INDEX_FILE, ex.getMessage());
            return List.of();
        }
    }
}
