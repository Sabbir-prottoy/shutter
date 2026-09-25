package com.shuttershot.service;

import com.shuttershot.dto.OrderResponse;
import com.shuttershot.dto.PlaceOrderRequest;
import com.shuttershot.exception.InvalidRequestException;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.OrderStatus;
import com.shuttershot.model.PaymentMethod;
import com.shuttershot.model.PaymentStatus;
import com.shuttershot.model.Product;
import com.shuttershot.model.ProductCategory;
import com.shuttershot.model.ShopOrder;
import com.shuttershot.model.ShopOrderItem;
import com.shuttershot.repository.ProductRepository;
import com.shuttershot.repository.ShopOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ShopOrderRepository shopOrderRepository;

    @Mock
    private SSLCommerzService sslCommerzService;

    private OrderService service;

    private final List<Product> shelf = new ArrayList<>();

    @BeforeEach
    void setUp() {
        service = new OrderService(productRepository, shopOrderRepository, sslCommerzService);
        ReflectionTestUtils.setField(service, "backendBaseUrl", "http://localhost:8080");
        ReflectionTestUtils.setField(service, "frontendBaseUrl", "http://localhost:5173");
        when(sslCommerzService.isConfigured()).thenReturn(true);
        when(sslCommerzService.initiateShopSession(any())).thenReturn("https://sandbox.sslcommerz.com/gw/abc");
        shelf.clear();

        when(productRepository.findAllByIdInAndActiveTrue(any())).thenAnswer(invocation -> {
            Collection<Long> ids = invocation.getArgument(0);
            return shelf.stream().filter(product -> ids.contains(product.getId())).toList();
        });
        when(productRepository.decrementStock(anyLong(), anyInt())).thenReturn(1);
        when(shopOrderRepository.save(any(ShopOrder.class))).thenAnswer(invocation -> {
            ShopOrder order = invocation.getArgument(0);
            if (order.getId() == null) {
                order.setId(42L);
            }
            return order;
        });
    }

    private Product product(long id, String name, int price, boolean digital) {
        Product product = Product.builder()
                .id(id).name(name).category(ProductCategory.ESSENTIALS).price(price).stock(10)
                .digital(digital).iconKey("bag").active(true).build();
        shelf.add(product);
        return product;
    }

    private static PlaceOrderRequest order(String district, String address, String email, PlaceOrderRequest.Item... items) {
        return new PlaceOrderRequest("  Rafi Ahmed ", "017 1234-5678", email, district, address, "  Please call first ",
                null, List.of(items));
    }

    private static PlaceOrderRequest onlineOrder(PlaceOrderRequest.Item... items) {
        return new PlaceOrderRequest("Rafi Ahmed", "01712345678", null, "Dhaka", "House 5", null,
                PaymentMethod.SSLCOMMERZ, List.of(items));
    }

    private static PlaceOrderRequest.Item line(long productId, int quantity) {
        return new PlaceOrderRequest.Item(productId, quantity);
    }

    @Test
    void deliveryFeeFollowsTheRules() {
        assertEquals(80, OrderService.deliveryFee(true, "Dhaka", 4_000));
        assertEquals(80, OrderService.deliveryFee(true, "dhaka", 4_000));
        assertEquals(150, OrderService.deliveryFee(true, "Sylhet", 4_000));
        assertEquals(0, OrderService.deliveryFee(true, "Sylhet", 10_000));
        assertEquals(150, OrderService.deliveryFee(true, "Sylhet", 9_999));
        assertEquals(0, OrderService.deliveryFee(false, null, 500));
    }

    @Test
    void phoneNumbersAreAcceptedInCommonFormsAndStoredOneWay() {
        assertEquals("01712345678", OrderService.normalizePhone("01712345678"));
        assertEquals("01712345678", OrderService.normalizePhone("+8801712345678"));
        assertEquals("01712345678", OrderService.normalizePhone("8801712345678"));
        assertEquals("01712345678", OrderService.normalizePhone(" 017-1234 5678 "));
        assertThrows(InvalidRequestException.class, () -> OrderService.normalizePhone("01212345678"));
        assertThrows(InvalidRequestException.class, () -> OrderService.normalizePhone("12345"));
        assertThrows(InvalidRequestException.class, () -> OrderService.normalizePhone(null));
        assertThrows(InvalidRequestException.class, () -> OrderService.normalizePhone("0171234567890"));
    }

    @Test
    void totalsAreCalculatedFromDatabasePricesAndDuplicateLinesAreMerged() {
        product(1, "Tripod", 6_900, false);
        product(2, "Blower", 650, false);

        OrderResponse response = service.place(order("Dhaka", "House 5, Road 3", null,
                line(1, 1), line(2, 2), line(2, 1)));

        assertEquals(6_900 + 650 * 3, response.getSubtotal());
        assertEquals(80, response.getDeliveryFee());
        assertEquals(6_900 + 650 * 3 + 80, response.getTotal());
        assertEquals(2, response.getItems().size());
        assertEquals(3, response.getItems().get(1).getQuantity());
        assertEquals(1_950, response.getItems().get(1).getLineTotal());
        assertEquals("01712345678", response.getPhone());
        assertEquals("Rafi Ahmed", response.getCustomerName());
        assertEquals("Please call first", response.getNote());
        assertEquals("PLACED", response.getStatus());
        assertEquals("CASH_ON_DELIVERY", response.getPaymentMethod());
        assertTrue(response.getOrderNumber().matches("SS-\\d{8}-000042"), response.getOrderNumber());
        verify(productRepository).decrementStock(1L, 1);
        verify(productRepository).decrementStock(2L, 3);
    }

    @Test
    void largeOrdersShipFree() {
        product(1, "Speedlight", 14_500, false);

        OrderResponse response = service.place(order("Sylhet", "Zindabazar", null, line(1, 1)));

        assertEquals(0, response.getDeliveryFee());
        assertEquals(14_500, response.getTotal());
    }

    @Test
    void anItemThatIsMissingOrHiddenStopsTheOrder() {
        product(1, "Tripod", 6_900, false);

        assertThrows(InvalidRequestException.class,
                () -> service.place(order("Dhaka", "House 5", null, line(1, 1), line(99, 1))));
        verify(shopOrderRepository, never()).save(any());
    }

    @Test
    void notEnoughStockStopsTheOrder() {
        product(1, "Tripod", 6_900, false);
        when(productRepository.decrementStock(1L, 5)).thenReturn(0);

        InvalidRequestException error = assertThrows(InvalidRequestException.class,
                () -> service.place(order("Dhaka", "House 5", null, line(1, 5))));

        assertTrue(error.getMessage().contains("Tripod"));
        verify(shopOrderRepository, never()).save(any());
    }

    @Test
    void deliveryNeedsADistrictFromTheListAndAnAddress() {
        product(1, "Tripod", 6_900, false);

        assertThrows(InvalidRequestException.class, () -> service.place(order(null, "House 5", null, line(1, 1))));
        assertThrows(InvalidRequestException.class, () -> service.place(order("Atlantis", "House 5", null, line(1, 1))));
        assertThrows(InvalidRequestException.class, () -> service.place(order("Dhaka", "  ", null, line(1, 1))));
    }

    @Test
    void digitalOnlyOrdersNeedAnEmailButNoAddressAndPayNoDelivery() {
        product(7, "Lightroom plan", 14_500, true);

        assertThrows(InvalidRequestException.class, () -> service.place(order(null, null, null, line(7, 1))));

        OrderResponse response = service.place(order(null, null, "rafi@example.com", line(7, 1)));

        assertEquals(0, response.getDeliveryFee());
        assertEquals(14_500, response.getTotal());
        assertNull(response.getAddress());
        assertNull(response.getDistrict());
        assertEquals("rafi@example.com", response.getEmail());
    }

    @Test
    void mixedOrdersNeedBothAnAddressAndAnEmail() {
        product(1, "Tripod", 6_900, false);
        product(7, "Lightroom plan", 14_500, true);

        assertThrows(InvalidRequestException.class,
                () -> service.place(order("Dhaka", "House 5", null, line(1, 1), line(7, 1))));

        OrderResponse response = service.place(order("Dhaka", "House 5", "rafi@example.com", line(1, 1), line(7, 1)));
        assertEquals(0, response.getDeliveryFee());
        assertEquals("House 5", response.getAddress());
    }

    private ShopOrder existingOrder(OrderStatus status) {
        ShopOrder existing = ShopOrder.builder().id(5L).orderNumber("SS-20260925-000005").status(status)
                .customerName("A").phone("01712345678")
                .paymentMethod(com.shuttershot.model.PaymentMethod.CASH_ON_DELIVERY)
                .subtotal(1_000).deliveryFee(80).total(1_080).build();
        existing.getItems().add(ShopOrderItem.builder().order(existing).productId(1L).productName("Tripod")
                .unitPrice(500).quantity(2).lineTotal(1_000).build());
        when(shopOrderRepository.findById(5L)).thenReturn(Optional.of(existing));
        return existing;
    }

    @Test
    void cancellingAnOrderPutsItsItemsBackInStock() {
        ShopOrder existing = existingOrder(OrderStatus.CONFIRMED);

        OrderResponse response = service.updateStatus(5L, OrderStatus.CANCELLED);

        assertEquals("CANCELLED", response.getStatus());
        assertEquals(OrderStatus.CANCELLED, existing.getStatus());
        verify(productRepository).incrementStock(1L, 2);
    }

    @Test
    void ordersMoveForwardWithoutTouchingStock() {
        ShopOrder existing = existingOrder(OrderStatus.PLACED);

        service.updateStatus(5L, OrderStatus.SHIPPED);

        assertEquals(OrderStatus.SHIPPED, existing.getStatus());
        verify(productRepository, never()).incrementStock(anyLong(), anyInt());
    }

    @Test
    void deliveredAndCancelledOrdersAreFinal() {
        existingOrder(OrderStatus.DELIVERED);
        assertThrows(InvalidRequestException.class, () -> service.updateStatus(5L, OrderStatus.CANCELLED));

        existingOrder(OrderStatus.CANCELLED);
        assertThrows(InvalidRequestException.class, () -> service.updateStatus(5L, OrderStatus.PLACED));
        verify(productRepository, never()).incrementStock(anyLong(), anyInt());
    }

    @Test
    void settingTheSameStatusAgainChangesNothing() {
        existingOrder(OrderStatus.CANCELLED);

        service.updateStatus(5L, OrderStatus.CANCELLED);

        verify(productRepository, never()).incrementStock(anyLong(), anyInt());
    }

    @Test
    void updatingAMissingOrderIsNotFound() {
        when(shopOrderRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.updateStatus(404L, OrderStatus.SHIPPED));
    }

    // ---- online payment (SSLCommerz) ----

    private ShopOrder onlineOrderInDb(OrderStatus status, PaymentStatus paymentStatus) {
        ShopOrder existing = ShopOrder.builder().id(5L).orderNumber("SS-20260925-000005").status(status)
                .customerName("A").phone("01712345678")
                .paymentMethod(PaymentMethod.SSLCOMMERZ).paymentStatus(paymentStatus).tranId("SHOP5-abc")
                .subtotal(1_000).deliveryFee(80).total(1_080).build();
        existing.getItems().add(ShopOrderItem.builder().order(existing).productId(1L).productName("Tripod")
                .unitPrice(500).quantity(2).lineTotal(1_000).build());
        when(shopOrderRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(shopOrderRepository.findByTranId("SHOP5-abc")).thenReturn(Optional.of(existing));
        return existing;
    }

    @Test
    void cashOnDeliveryOrdersStartUnpaidAndNeverTouchTheGateway() {
        product(1, "Tripod", 6_900, false);

        OrderResponse response = service.place(order("Dhaka", "House 5", null, line(1, 1)));

        assertEquals("UNPAID", response.getPaymentStatus());
        assertNull(response.getGatewayUrl());
        verify(sslCommerzService, never()).initiateShopSession(any());
    }

    @Test
    void onlineOrdersStartPendingAndCarryTheGatewayUrl() {
        product(1, "Tripod", 6_900, false);

        OrderResponse response = service.place(onlineOrder(line(1, 1)));

        assertEquals("SSLCOMMERZ", response.getPaymentMethod());
        assertEquals("PENDING", response.getPaymentStatus());
        assertEquals("PLACED", response.getStatus());
        assertEquals("https://sandbox.sslcommerz.com/gw/abc", response.getGatewayUrl());
        verify(sslCommerzService).initiateShopSession(org.mockito.ArgumentMatchers.argThat(session ->
                session.amount().compareTo(new BigDecimal("6980")) == 0
                        && session.tranId().startsWith("SHOP42-")
                        && session.successUrl().equals("http://localhost:8080/api/shop/payment/success")
                        && session.physical()));
    }

    @Test
    void onlinePaymentIsRefusedBeforeTouchingStockWhenTheGatewayIsNotConfigured() {
        product(1, "Tripod", 6_900, false);
        when(sslCommerzService.isConfigured()).thenReturn(false);

        assertThrows(InvalidRequestException.class, () -> service.place(onlineOrder(line(1, 1))));
        verify(productRepository, never()).decrementStock(anyLong(), anyInt());
    }

    @Test
    void aGatewayFailureCancelsTheOrderAttempt() {
        product(1, "Tripod", 6_900, false);
        when(sslCommerzService.initiateShopSession(any())).thenThrow(new IllegalStateException("down"));

        assertThrows(InvalidRequestException.class, () -> service.place(onlineOrder(line(1, 1))));
    }

    @Test
    void aValidatedPaymentMarksTheOrderPaid() {
        ShopOrder existing = onlineOrderInDb(OrderStatus.PLACED, PaymentStatus.PENDING);
        when(sslCommerzService.validateTransaction("VAL1", new BigDecimal("1080"))).thenReturn(true);

        OrderService.PaymentOutcome outcome = service.confirmOnlinePayment("SHOP5-abc", "VAL1");

        assertEquals("success", outcome.result());
        assertEquals(PaymentStatus.PAID, existing.getPaymentStatus());
        assertEquals(OrderStatus.PLACED, existing.getStatus());
        assertTrue(existing.getPaidAt() != null);
        verify(productRepository, never()).incrementStock(anyLong(), anyInt());
    }

    @Test
    void confirmingAPaidOrderAgainIsHarmless() {
        onlineOrderInDb(OrderStatus.PLACED, PaymentStatus.PAID);

        assertEquals("success", service.confirmOnlinePayment("SHOP5-abc", "VAL1").result());
        verify(sslCommerzService, never()).validateTransaction(any(), any());
    }

    @Test
    void aPaymentTheGatewayDoesNotVouchForCancelsTheOrderAndRestocks() {
        ShopOrder existing = onlineOrderInDb(OrderStatus.PLACED, PaymentStatus.PENDING);
        when(sslCommerzService.validateTransaction(any(), any())).thenReturn(false);

        OrderService.PaymentOutcome outcome = service.confirmOnlinePayment("SHOP5-abc", "FAKE");

        assertEquals("failed", outcome.result());
        assertEquals(PaymentStatus.FAILED, existing.getPaymentStatus());
        assertEquals(OrderStatus.CANCELLED, existing.getStatus());
        verify(productRepository).incrementStock(1L, 2);
    }

    @Test
    void anUnknownTransactionIsAFailure() {
        when(shopOrderRepository.findByTranId("nope")).thenReturn(Optional.empty());

        OrderService.PaymentOutcome outcome = service.confirmOnlinePayment("nope", "VAL");

        assertEquals("failed", outcome.result());
        assertNull(outcome.orderNumber());
    }

    @Test
    void leavingThePaymentPageReleasesTheStockOnce() {
        ShopOrder existing = onlineOrderInDb(OrderStatus.PLACED, PaymentStatus.PENDING);

        OrderService.PaymentOutcome outcome = service.abandonOnlinePayment("SHOP5-abc", PaymentStatus.CANCELLED);
        service.abandonOnlinePayment("SHOP5-abc", PaymentStatus.CANCELLED);

        assertEquals("cancelled", outcome.result());
        assertEquals(PaymentStatus.CANCELLED, existing.getPaymentStatus());
        assertEquals(OrderStatus.CANCELLED, existing.getStatus());
        verify(productRepository, org.mockito.Mockito.times(1)).incrementStock(1L, 2);
    }

    @Test
    void aFailureCallbackNeverUndoesAnOrderThatWasPaid() {
        ShopOrder existing = onlineOrderInDb(OrderStatus.PLACED, PaymentStatus.PAID);

        service.abandonOnlinePayment("SHOP5-abc", PaymentStatus.FAILED);

        assertEquals(PaymentStatus.PAID, existing.getPaymentStatus());
        assertEquals(OrderStatus.PLACED, existing.getStatus());
        verify(productRepository, never()).incrementStock(anyLong(), anyInt());
    }

    @Test
    void aLatePaymentReinstatesTheOrderWhenStockAllows() {
        ShopOrder existing = onlineOrderInDb(OrderStatus.CANCELLED, PaymentStatus.CANCELLED);
        when(sslCommerzService.validateTransaction(any(), any())).thenReturn(true);

        service.confirmOnlinePayment("SHOP5-abc", "VAL1");

        assertEquals(OrderStatus.PLACED, existing.getStatus());
        assertEquals(PaymentStatus.PAID, existing.getPaymentStatus());
        verify(productRepository).decrementStock(1L, 2);
    }

    @Test
    void aLatePaymentWithoutStockStaysCancelledButIsMarkedPaidForRefund() {
        ShopOrder existing = onlineOrderInDb(OrderStatus.CANCELLED, PaymentStatus.CANCELLED);
        when(sslCommerzService.validateTransaction(any(), any())).thenReturn(true);
        when(productRepository.decrementStock(1L, 2)).thenReturn(0);

        service.confirmOnlinePayment("SHOP5-abc", "VAL1");

        assertEquals(OrderStatus.CANCELLED, existing.getStatus());
        assertEquals(PaymentStatus.PAID, existing.getPaymentStatus());
    }

    @Test
    void anOrderAwaitingPaymentCanOnlyBeCancelled() {
        ShopOrder existing = onlineOrderInDb(OrderStatus.PLACED, PaymentStatus.PENDING);

        assertThrows(InvalidRequestException.class, () -> service.updateStatus(5L, OrderStatus.CONFIRMED));

        service.updateStatus(5L, OrderStatus.CANCELLED);
        assertEquals(OrderStatus.CANCELLED, existing.getStatus());
        assertEquals(PaymentStatus.CANCELLED, existing.getPaymentStatus());
        verify(productRepository).incrementStock(1L, 2);
    }

    @Test
    void paidOrdersMoveThroughTheNormalSteps() {
        ShopOrder existing = onlineOrderInDb(OrderStatus.PLACED, PaymentStatus.PAID);

        service.updateStatus(5L, OrderStatus.CONFIRMED);

        assertEquals(OrderStatus.CONFIRMED, existing.getStatus());
    }

    @Test
    void staleUnpaidOnlineOrdersAreReleased() {
        ShopOrder stale = onlineOrderInDb(OrderStatus.PLACED, PaymentStatus.PENDING);
        when(shopOrderRepository.findByPaymentStatusAndCreatedAtBefore(any(), any())).thenReturn(List.of(stale));

        assertEquals(1, service.expireStalePayments());
        assertEquals(OrderStatus.CANCELLED, stale.getStatus());
        assertEquals(PaymentStatus.CANCELLED, stale.getPaymentStatus());
        verify(productRepository).incrementStock(1L, 2);
    }

    @Test
    void theStorefrontReturnLinkCarriesTheResultAndOrder() {
        assertEquals("http://localhost:5173/marketplace/checkout?payment=success&order=SS-1",
                service.paymentReturnUrl(new OrderService.PaymentOutcome("success", "SS-1")));
        assertEquals("http://localhost:5173/marketplace/checkout?payment=failed",
                service.paymentReturnUrl(new OrderService.PaymentOutcome("failed", null)));
    }
}
