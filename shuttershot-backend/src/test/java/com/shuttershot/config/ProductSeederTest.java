package com.shuttershot.config;

import com.shuttershot.model.Product;
import com.shuttershot.model.ProductCategory;
import com.shuttershot.service.ProductIcons;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

// Guards the starting catalogue: a typo in an icon key or a nonsense price would
// otherwise only show up on the live shop.
class ProductSeederTest {

    private final List<Product> catalogue = ProductSeeder.catalogue();

    @Test
    void everyCategoryHasProductsAndEverythingListedIsThere() {
        Map<ProductCategory, Long> counts = catalogue.stream()
                .collect(Collectors.groupingBy(Product::getCategory, Collectors.counting()));

        assertEquals(ProductCategory.values().length, counts.size());
        assertEquals(12, counts.get(ProductCategory.ESSENTIALS));
        assertEquals(10, counts.get(ProductCategory.LIGHTING));
        assertEquals(7, counts.get(ProductCategory.LENSES));
        assertEquals(6, counts.get(ProductCategory.SUPPORT));
        assertEquals(10, counts.get(ProductCategory.STORAGE));
        assertEquals(8, counts.get(ProductCategory.AUDIO_VIDEO));
        assertEquals(8, counts.get(ProductCategory.SOFTWARE));
        assertEquals(6, counts.get(ProductCategory.EVERYDAY));
    }

    @Test
    void everyProductIsSellableAndUsesAKnownIcon() {
        for (Product product : catalogue) {
            String label = product.getName();
            assertTrue(ProductIcons.KEYS.contains(product.getIconKey()), label + " has unknown icon " + product.getIconKey());
            assertTrue(product.getPrice() > 0, label + " needs a price");
            assertTrue(product.getStock() > 0, label + " needs stock");
            assertTrue(product.getName().length() <= 150, label + " name too long");
            assertTrue(product.getDescription().length() <= 500, label + " description too long");
            if (product.getOldPrice() != null) {
                assertTrue(product.getOldPrice() > product.getPrice(), label + " old price must be higher");
            }
        }
    }

    @Test
    void namesAreUniqueAndDigitalItemsAreTheSubscriptions() {
        Set<String> names = catalogue.stream().map(Product::getName).collect(Collectors.toSet());
        assertEquals(catalogue.size(), names.size());

        List<String> digital = catalogue.stream().filter(Product::isDigital).map(Product::getName).toList();
        assertEquals(6, digital.size(), digital.toString());
        assertTrue(digital.stream().allMatch(name -> name.contains("plan")), digital.toString());
        assertFalse(catalogue.stream().filter(Product::isDigital)
                .anyMatch(product -> product.getCategory() != ProductCategory.SOFTWARE));
    }
}
