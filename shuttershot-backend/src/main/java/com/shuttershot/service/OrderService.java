package com.shuttershot.service;

import com.shuttershot.dto.DeliveryRulesResponse;
import com.shuttershot.dto.OrderResponse;
import com.shuttershot.dto.PagedResponse;
import com.shuttershot.dto.PlaceOrderRequest;
import com.shuttershot.exception.InvalidRequestException;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.OrderStatus;
import com.shuttershot.model.PaymentMethod;
import com.shuttershot.model.PaymentStatus;
import com.shuttershot.model.Product;
import com.shuttershot.model.ShopOrder;
import com.shuttershot.model.ShopOrderItem;
import com.shuttershot.repository.ProductRepository;
import com.shuttershot.repository.ShopOrderRepository;
import com.shuttershot.util.BangladeshDistricts;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class OrderService {

    static final int DELIVERY_INSIDE_DHAKA = 80;
    static final int DELIVERY_OUTSIDE_DHAKA = 150;
    static final int FREE_DELIVERY_FROM = 10_000;

    private static final int MAX_PAGE_SIZE = 50;

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    // How long an online order keeps its stock reserved while waiting for payment.
    private static final int PAYMENT_WINDOW_MINUTES = 60;

    // 01XXXXXXXXX, optionally written with the +880 / 880 country code.
    private static final Pattern BD_MOBILE = Pattern.compile("^(?:\\+?880|0)?(1[3-9]\\d{8})$");

    private final ProductRepository productRepository;
    private final ShopOrderRepository shopOrderRepository;
    private final SSLCommerzService sslCommerzService;

    @Value("${app.base-url}")
    private String backendBaseUrl;

    @Value("${app.frontend-url}")
    private String frontendBaseUrl;

    // Where the browser lands after the SSLCommerz page: the result and the order it was for.
    public record PaymentOutcome(String result, String orderNumber) {
    }

    public DeliveryRulesResponse deliveryRules() {
        return new DeliveryRulesResponse(DELIVERY_INSIDE_DHAKA, DELIVERY_OUTSIDE_DHAKA, FREE_DELIVERY_FROM,
                sslCommerzService.isConfigured());
    }

    // Digital items (software, subscriptions) ship nothing, so an order made only of
    // them pays no delivery. Otherwise: free above the threshold, cheaper inside Dhaka.
    static int deliveryFee(boolean anyPhysicalItem, String district, int subtotal) {
        if (!anyPhysicalItem || subtotal >= FREE_DELIVERY_FROM) {
            return 0;
        }
        return "Dhaka".equalsIgnoreCase(district) ? DELIVERY_INSIDE_DHAKA : DELIVERY_OUTSIDE_DHAKA;
    }

    static String normalizePhone(String phone) {
        String cleaned = phone == null ? "" : phone.replaceAll("[\\s-]", "");
        java.util.regex.Matcher matcher = BD_MOBILE.matcher(cleaned);
        if (!matcher.matches()) {
            throw new InvalidRequestException("Enter a valid Bangladeshi mobile number, like 01712345678");
        }
        return "0" + matcher.group(1);
    }

    // Prices, names and totals are always read from the database, never from
    // the browser, so a tampered cart can't change what is charged.
    @Transactional
    public OrderResponse place(PlaceOrderRequest request) {
        PaymentMethod paymentMethod = request.getPaymentMethod() == null
                ? PaymentMethod.CASH_ON_DELIVERY : request.getPaymentMethod();
        boolean online = paymentMethod == PaymentMethod.SSLCOMMERZ;
        if (online && !sslCommerzService.isConfigured()) {
            throw new InvalidRequestException("Online payment isn't available right now. Please choose cash on delivery.");
        }

        Map<Long, Integer> wanted = new LinkedHashMap<>();
        for (PlaceOrderRequest.Item item : request.getItems()) {
            wanted.merge(item.getProductId(), item.getQuantity(), Integer::sum);
        }
        if (wanted.values().stream().anyMatch(quantity -> quantity > 20)) {
            throw new InvalidRequestException("You can order at most 20 of one item");
        }

        Map<Long, Product> products = new LinkedHashMap<>();
        for (Product product : productRepository.findAllByIdInAndActiveTrue(wanted.keySet())) {
            products.put(product.getId(), product);
        }
        for (Long id : wanted.keySet()) {
            if (!products.containsKey(id)) {
                throw new InvalidRequestException("An item in your cart is no longer available. Please review your cart.");
            }
        }

        boolean anyPhysical = products.values().stream().anyMatch(product -> !product.isDigital());
        String district = trimToNull(request.getDistrict());
        String address = trimToNull(request.getAddress());
        if (anyPhysical) {
            if (district == null || !BangladeshDistricts.isValid(district)) {
                throw new InvalidRequestException("Choose your district for delivery");
            }
            if (address == null) {
                throw new InvalidRequestException("Enter your delivery address");
            }
        }

        String email = trimToNull(request.getEmail());
        boolean anyDigital = products.values().stream().anyMatch(Product::isDigital);
        if (anyDigital && email == null) {
            throw new InvalidRequestException("Enter your email address - software and subscriptions are delivered by email");
        }

        ShopOrder order = ShopOrder.builder()
                .customerName(request.getCustomerName().trim())
                .phone(normalizePhone(request.getPhone()))
                .email(email)
                .district(anyPhysical ? district : null)
                .address(anyPhysical ? address : null)
                .note(trimToNull(request.getNote()))
                .paymentMethod(paymentMethod)
                .paymentStatus(online ? PaymentStatus.PENDING : PaymentStatus.UNPAID)
                .status(OrderStatus.PLACED)
                .subtotal(0)
                .deliveryFee(0)
                .total(0)
                .build();

        int subtotal = 0;
        for (Map.Entry<Long, Integer> entry : wanted.entrySet()) {
            Product product = products.get(entry.getKey());
            int quantity = entry.getValue();

            if (productRepository.decrementStock(product.getId(), quantity) == 0) {
                throw new InvalidRequestException(
                        "Sorry, \"" + product.getName() + "\" doesn't have " + quantity + " left in stock");
            }

            int lineTotal = product.getPrice() * quantity;
            subtotal += lineTotal;
            order.getItems().add(ShopOrderItem.builder()
                    .order(order)
                    .productId(product.getId())
                    .productName(product.getName())
                    .unitPrice(product.getPrice())
                    .quantity(quantity)
                    .lineTotal(lineTotal)
                    .digital(product.isDigital())
                    .build());
        }

        int fee = deliveryFee(anyPhysical, district, subtotal);
        order.setSubtotal(subtotal);
        order.setDeliveryFee(fee);
        order.setTotal(subtotal + fee);

        ShopOrder saved = shopOrderRepository.save(order);
        saved.setOrderNumber("SS-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE)
                + "-" + String.format("%06d", saved.getId()));

        OrderResponse response = toResponse(saved);
        if (online) {
            saved.setTranId("SHOP" + saved.getId() + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
            try {
                response.setGatewayUrl(sslCommerzService.initiateShopSession(new SSLCommerzService.ShopSession(
                        BigDecimal.valueOf(saved.getTotal()).setScale(2),
                        saved.getTranId(),
                        backendBaseUrl + "/api/shop/payment/success",
                        backendBaseUrl + "/api/shop/payment/fail",
                        backendBaseUrl + "/api/shop/payment/cancel",
                        saved.getCustomerName(), saved.getEmail(), saved.getPhone(),
                        saved.getAddress(), saved.getDistrict(),
                        describeItems(saved), saved.getItems().size(), anyPhysical)));
            } catch (IllegalStateException ex) {
                // Throwing rolls the whole order back, which puts the reserved stock back too.
                log.warn("Could not start online payment for order {}: {}", saved.getOrderNumber(), ex.getMessage());
                throw new InvalidRequestException(
                        "We couldn't start the online payment. Please try again or choose cash on delivery.");
            }
        }
        return response;
    }

    // SSLCommerz redirects the browser here with a POST; the redirect alone proves
    // nothing, so the payment is only accepted after asking the gateway directly.
    @Transactional
    public PaymentOutcome confirmOnlinePayment(String tranId, String valId) {
        ShopOrder order = shopOrderRepository.findByTranId(tranId).orElse(null);
        if (order == null) {
            return new PaymentOutcome("failed", null);
        }
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            return new PaymentOutcome("success", order.getOrderNumber());
        }

        if (!sslCommerzService.validateTransaction(valId, BigDecimal.valueOf(order.getTotal()))) {
            if (order.getPaymentStatus() == PaymentStatus.PENDING) {
                cancelUnpaidOrder(order, PaymentStatus.FAILED);
            }
            return new PaymentOutcome("failed", order.getOrderNumber());
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            // The customer paid after the order was released. Honour it if the goods
            // are still in stock, otherwise leave it cancelled and flag it for a refund.
            if (reserveStock(order)) {
                order.setStatus(OrderStatus.PLACED);
                log.info("Order {} was paid after being cancelled and has been reinstated", order.getOrderNumber());
            } else {
                log.warn("Order {} was paid after being cancelled and is out of stock - refund needed",
                        order.getOrderNumber());
            }
        }
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setPaidAt(LocalDateTime.now());
        return new PaymentOutcome("success", order.getOrderNumber());
    }

    // The customer failed or backed out of the payment page: release the reserved stock.
    @Transactional
    public PaymentOutcome abandonOnlinePayment(String tranId, PaymentStatus reason) {
        String result = reason == PaymentStatus.CANCELLED ? "cancelled" : "failed";
        ShopOrder order = shopOrderRepository.findByTranId(tranId).orElse(null);
        if (order == null) {
            return new PaymentOutcome(result, null);
        }
        if (order.getPaymentStatus() == PaymentStatus.PENDING) {
            cancelUnpaidOrder(order, reason);
        }
        return new PaymentOutcome(result, order.getOrderNumber());
    }

    public String paymentReturnUrl(PaymentOutcome outcome) {
        String url = frontendBaseUrl + "/marketplace/checkout?payment=" + outcome.result();
        if (outcome.orderNumber() != null) {
            url += "&order=" + outcome.orderNumber();
        }
        return url;
    }

    // Online orders nobody paid for within the window give their stock back.
    @Transactional
    public int expireStalePayments() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(PAYMENT_WINDOW_MINUTES);
        int released = 0;
        for (ShopOrder order : shopOrderRepository.findByPaymentStatusAndCreatedAtBefore(PaymentStatus.PENDING, cutoff)) {
            cancelUnpaidOrder(order, PaymentStatus.CANCELLED);
            released++;
        }
        if (released > 0) {
            log.info("Released {} online order(s) that were never paid", released);
        }
        return released;
    }

    private void cancelUnpaidOrder(ShopOrder order, PaymentStatus paymentStatus) {
        if (!order.getStatus().isFinal()) {
            restock(order);
            order.setStatus(OrderStatus.CANCELLED);
        }
        order.setPaymentStatus(paymentStatus);
    }

    private void restock(ShopOrder order) {
        for (ShopOrderItem item : order.getItems()) {
            productRepository.incrementStock(item.getProductId(), item.getQuantity());
        }
    }

    // All-or-nothing: if any item is short, whatever was taken is put back.
    private boolean reserveStock(ShopOrder order) {
        List<ShopOrderItem> taken = new ArrayList<>();
        for (ShopOrderItem item : order.getItems()) {
            if (productRepository.decrementStock(item.getProductId(), item.getQuantity()) == 0) {
                for (ShopOrderItem done : taken) {
                    productRepository.incrementStock(done.getProductId(), done.getQuantity());
                }
                return false;
            }
            taken.add(item);
        }
        return true;
    }

    private static String describeItems(ShopOrder order) {
        List<ShopOrderItem> items = order.getItems();
        String first = items.get(0).getProductName();
        return items.size() == 1 ? first : first + " + " + (items.size() - 1) + " more";
    }

    @Transactional(readOnly = true)
    public PagedResponse<OrderResponse> listForAdmin(OrderStatus status, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        PageRequest pageRequest = PageRequest.of(safePage, safeSize);

        Page<ShopOrder> result = status == null
                ? shopOrderRepository.findAllByOrderByCreatedAtDesc(pageRequest)
                : shopOrderRepository.findByStatusOrderByCreatedAtDesc(status, pageRequest);

        return PagedResponse.<OrderResponse>builder()
                .items(result.getContent().stream().map(this::toResponse).toList())
                .page(safePage)
                .size(safeSize)
                .total(result.getTotalElements())
                .hasMore(result.hasNext())
                .build();
    }

    // Delivered and cancelled orders are finished. Cancelling puts the items back in stock.
    @Transactional
    public OrderResponse updateStatus(Long id, OrderStatus next) {
        ShopOrder order = shopOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        if (order.getStatus() == next) {
            return toResponse(order);
        }
        if (order.getStatus().isFinal()) {
            throw new InvalidRequestException("This order is already " + order.getStatus().name().toLowerCase()
                    + " and can't be changed");
        }

        boolean awaitingPayment = order.getPaymentStatus() == PaymentStatus.PENDING;
        if (awaitingPayment && next != OrderStatus.CANCELLED) {
            throw new InvalidRequestException("This order is waiting for the customer's online payment.");
        }

        if (next == OrderStatus.CANCELLED) {
            restock(order);
            if (awaitingPayment) {
                order.setPaymentStatus(PaymentStatus.CANCELLED);
            }
        }
        order.setStatus(next);
        return toResponse(order);
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    OrderResponse toResponse(ShopOrder order) {
        List<OrderResponse.Item> items = order.getItems().stream()
                .map(item -> OrderResponse.Item.builder()
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .unitPrice(item.getUnitPrice())
                        .quantity(item.getQuantity())
                        .lineTotal(item.getLineTotal())
                        .digital(item.isDigital())
                        .build())
                .toList();
        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus().name())
                .customerName(order.getCustomerName())
                .phone(order.getPhone())
                .email(order.getEmail())
                .district(order.getDistrict())
                .address(order.getAddress())
                .note(order.getNote())
                .paymentMethod(order.getPaymentMethod().name())
                .paymentStatus(order.getPaymentStatus() == null
                        ? PaymentStatus.UNPAID.name() : order.getPaymentStatus().name())
                .paidAt(order.getPaidAt())
                .subtotal(order.getSubtotal())
                .deliveryFee(order.getDeliveryFee())
                .total(order.getTotal())
                .createdAt(order.getCreatedAt())
                .items(items)
                .build();
    }
}
