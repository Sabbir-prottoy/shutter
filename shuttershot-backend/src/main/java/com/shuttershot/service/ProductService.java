package com.shuttershot.service;

import com.shuttershot.dto.CategoryCountResponse;
import com.shuttershot.dto.PagedResponse;
import com.shuttershot.dto.PhotoCreditResponse;
import com.shuttershot.dto.ProductRequest;
import com.shuttershot.dto.ProductResponse;
import com.shuttershot.exception.InvalidRequestException;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.Product;
import com.shuttershot.model.ProductCategory;
import com.shuttershot.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.Comparator;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProductService {

    private static final int MAX_PAGE_SIZE = 48;
    private static final int MAX_IDS = 60;

    private final ProductRepository productRepository;
    private final FileStorageService fileStorageService;

    // ---------------------------------------------------------------- public shop

    @Transactional(readOnly = true)
    public PagedResponse<ProductResponse> list(ProductCategory category, String q, String sort, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);

        Specification<Product> spec = (root, query, cb) -> cb.isTrue(root.get("active"));

        if (category != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("category"), category));
        }

        if (StringUtils.hasText(q)) {
            String pattern = "%" + q.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern)));
        }

        Page<Product> result = productRepository.findAll(spec, PageRequest.of(safePage, safeSize, sortFor(sort)));

        return PagedResponse.<ProductResponse>builder()
                .items(result.getContent().stream().map(this::toResponse).toList())
                .page(safePage)
                .size(safeSize)
                .total(result.getTotalElements())
                .hasMore(result.hasNext())
                .build();
    }

    // Used by the cart, which only remembers product ids: current names,
    // prices and stock come from here, never from what the browser stored.
    @Transactional(readOnly = true)
    public List<ProductResponse> byIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        if (ids.size() > MAX_IDS) {
            throw new InvalidRequestException("Too many products requested at once");
        }
        return productRepository.findAllByIdInAndActiveTrue(Set.copyOf(ids)).stream()
                .sorted(Comparator.comparing(Product::getId))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CategoryCountResponse> categoryCounts() {
        return productRepository.countActiveByCategory().stream()
                .map(row -> new CategoryCountResponse(row.getCategory().name().toLowerCase(), row.getCount()))
                .toList();
    }

    // Every photo in the shop that must be credited, for the "Photo credits" list.
    @Transactional(readOnly = true)
    public List<PhotoCreditResponse> photoCredits() {
        return productRepository.findAllByOrderByCategoryAscIdAsc().stream()
                .filter(product -> product.isActive() && product.getImageUrl() != null && product.getImageCredit() != null)
                .map(product -> new PhotoCreditResponse(product.getName(), product.getImageCredit(), product.getImageSource()))
                .toList();
    }

    // ---------------------------------------------------------------- admin

    @Transactional(readOnly = true)
    public List<ProductResponse> listAll() {
        return productRepository.findAllByOrderByCategoryAscIdAsc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Product product = new Product();
        apply(product, request);
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = findById(id);
        apply(product, request);
        return toResponse(product);
    }

    @Transactional
    public void delete(Long id) {
        Product product = findById(id);
        fileStorageService.delete(product.getImageUrl());
        productRepository.delete(product);
    }

    @Transactional
    public ProductResponse setImage(Long id, MultipartFile file) {
        Product product = findById(id);
        String newUrl = fileStorageService.store(file);
        fileStorageService.delete(product.getImageUrl());
        product.setImageUrl(newUrl);
        // An admin's own photo needs no third-party credit.
        product.setImageCredit(null);
        product.setImageSource(null);
        product.setSampleImageApplied(true);
        return toResponse(product);
    }

    @Transactional
    public ProductResponse removeImage(Long id) {
        Product product = findById(id);
        fileStorageService.delete(product.getImageUrl());
        product.setImageUrl(null);
        product.setImageCredit(null);
        product.setImageSource(null);
        product.setSampleImageApplied(true);
        return toResponse(product);
    }

    // ---------------------------------------------------------------- helpers

    private void apply(Product product, ProductRequest request) {
        if (!ProductIcons.KEYS.contains(request.getIconKey())) {
            throw new InvalidRequestException("Unknown icon: " + request.getIconKey());
        }

        Integer oldPrice = request.getOldPrice();
        // A "was" price that isn't higher than the price is not a discount.
        if (oldPrice != null && oldPrice <= request.getPrice()) {
            oldPrice = null;
        }

        product.setName(request.getName().trim());
        product.setDescription(StringUtils.hasText(request.getDescription()) ? request.getDescription().trim() : null);
        product.setCategory(request.getCategory());
        product.setPrice(request.getPrice());
        product.setOldPrice(oldPrice);
        product.setStock(request.getStock());
        product.setDigital(request.isDigital());
        product.setIconKey(request.getIconKey());
        product.setActive(request.isActive());
    }

    private Product findById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    private static Sort sortFor(String sort) {
        if (sort == null) {
            return Sort.by(Sort.Order.asc("id"));
        }
        return switch (sort) {
            case "price_asc" -> Sort.by(Sort.Order.asc("price"), Sort.Order.asc("id"));
            case "price_desc" -> Sort.by(Sort.Order.desc("price"), Sort.Order.asc("id"));
            case "name" -> Sort.by(Sort.Order.asc("name"), Sort.Order.asc("id"));
            case "newest" -> Sort.by(Sort.Order.desc("id"));
            default -> Sort.by(Sort.Order.asc("id"));
        };
    }

    ProductResponse toResponse(Product product) {
        Integer oldPrice = product.getOldPrice();
        int discount = oldPrice != null && oldPrice > product.getPrice()
                ? (int) Math.round((oldPrice - product.getPrice()) * 100.0 / oldPrice)
                : 0;
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .category(product.getCategory().name().toLowerCase())
                .price(product.getPrice())
                .oldPrice(discount > 0 ? oldPrice : null)
                .discountPercent(discount)
                .stock(product.getStock())
                .inStock(product.getStock() > 0)
                .digital(product.isDigital())
                .iconKey(product.getIconKey())
                .imageUrl(product.getImageUrl())
                .imageCredit(product.getImageCredit())
                .imageSource(product.getImageSource())
                .active(product.isActive())
                .build();
    }
}
