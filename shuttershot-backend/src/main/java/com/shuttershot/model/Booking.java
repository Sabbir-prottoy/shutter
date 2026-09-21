package com.shuttershot.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "photographer_id", nullable = false)
    private PhotographerProfile photographer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", nullable = false)
    private Package servicePackage;

    // Null for guest bookings — only set when the person booking was logged
    // in at the time, so they can look the booking up under their account.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_user_id")
    private User customer;

    @Column(name = "client_name", nullable = false)
    private String clientName;

    @Column(name = "client_phone", nullable = false)
    private String clientPhone;

    @Column(name = "client_email", nullable = false)
    private String clientEmail;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "time_slot", nullable = false)
    private String timeSlot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    // Set true once the customer has passed whichever method verificationMethod
    // names — phone/email OTP entry, an authenticator TOTP code, or a QR scan.
    // The field predates the multi-method feature (it only used to mean "phone
    // OTP confirmed"), but its meaning generalizes cleanly, so it wasn't renamed.
    @Column(name = "otp_verified", nullable = false)
    @Builder.Default
    private boolean otpVerified = false;

    // Null until the customer picks one on the booking flow's verification step.
    // Nullable and default-free by design: existing bookings predate this
    // feature and were always phone-OTP in practice, so there's nothing
    // meaningful to backfill, and new bookings always set it explicitly.
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_method", length = 20)
    private BookingVerificationMethod verificationMethod;

    // Set only when verificationMethod is QR_CODE — the opaque value encoded in
    // the QR the photographer shows the customer in person (see
    // BookingService.getQrCodeForBooking / verifyByQrToken).
    @Column(name = "qr_verification_token", unique = true)
    private String qrVerificationToken;

    // Set only when verificationMethod is TOTP — the Base32 secret shared with
    // the customer's authenticator app via the enrollment QR, checked against
    // the 6-digit code they submit (see BookingService.confirmOtp).
    @Column(name = "totp_secret")
    private String totpSecret;

    // 10% of the package price, charged via SSLCommerz before a booking can be
    // confirmed. Null only for bookings created before this feature existed.
    @Column(name = "deposit_amount", precision = 10, scale = 2)
    private BigDecimal depositAmount;

    // Defaults to true at the column level so the migration doesn't retroactively
    // block existing bookings from being confirmed; BookingService.create() always
    // sets this explicitly to false for every new booking going forward.
    @Column(name = "deposit_paid", nullable = false)
    @ColumnDefault("true")
    @Builder.Default
    private boolean depositPaid = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
