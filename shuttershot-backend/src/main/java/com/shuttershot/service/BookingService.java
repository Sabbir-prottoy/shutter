package com.shuttershot.service;

import com.shuttershot.dto.BookingDepositInitResponse;
import com.shuttershot.dto.BookingResponse;
import com.shuttershot.dto.BookingVerificationSetupResponse;
import com.shuttershot.dto.CreateBookingRequest;
import com.shuttershot.dto.QrCodeResponse;
import com.shuttershot.exception.InvalidRequestException;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.Availability;
import com.shuttershot.model.AvailabilityStatus;
import com.shuttershot.model.Booking;
import com.shuttershot.model.BookingPaymentStatus;
import com.shuttershot.model.BookingPaymentTransaction;
import com.shuttershot.model.BookingStatus;
import com.shuttershot.model.BookingVerificationMethod;
import com.shuttershot.model.Package;
import com.shuttershot.model.PhotographerProfile;
import com.shuttershot.model.User;
import com.shuttershot.repository.AvailabilityRepository;
import com.shuttershot.repository.BookingPaymentTransactionRepository;
import com.shuttershot.repository.BookingRepository;
import com.shuttershot.repository.PackageRepository;
import com.shuttershot.repository.PhotographerProfileRepository;
import com.shuttershot.repository.ReviewRepository;
import com.shuttershot.repository.UserRepository;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import com.warrenstrange.googleauth.GoogleAuthenticatorQRGenerator;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);
    private static final BigDecimal DEPOSIT_RATE = new BigDecimal("0.10");
    private static final GoogleAuthenticator GOOGLE_AUTHENTICATOR = new GoogleAuthenticator();

    private final BookingRepository bookingRepository;
    private final PackageRepository packageRepository;
    private final PhotographerProfileRepository photographerProfileRepository;
    private final AvailabilityRepository availabilityRepository;
    private final UserRepository userRepository;
    private final OtpService otpService;
    private final QrCodeService qrCodeService;
    private final BookingPaymentTransactionRepository bookingPaymentTransactionRepository;
    private final SSLCommerzService sslCommerzService;
    private final ReviewRepository reviewRepository;

    @Value("${app.base-url}")
    private String backendBaseUrl;

    @Value("${app.frontend-url}")
    private String frontendBaseUrl;

    @Transactional
    public BookingResponse create(CreateBookingRequest request, Long customerUserId) {
        PhotographerProfile photographer = photographerProfileRepository.findById(request.getPhotographerId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Photographer not found with id: " + request.getPhotographerId()));

        Package pkg = packageRepository.findById(request.getPackageId())
                .orElseThrow(() -> new ResourceNotFoundException("Package not found with id: " + request.getPackageId()));

        if (!pkg.getPhotographer().getId().equals(photographer.getId())) {
            throw new InvalidRequestException("Selected package does not belong to the selected photographer");
        }

        if (request.getBookingDate().isBefore(LocalDate.now())) {
            throw new InvalidRequestException("Booking date cannot be in the past");
        }

        availabilityRepository.findByPhotographerIdAndDate(photographer.getId(), request.getBookingDate())
                .filter(availability -> availability.getStatus() != AvailabilityStatus.FREE)
                .ifPresent(availability -> {
                    throw new InvalidRequestException("Photographer is not available on the selected date");
                });

        User customer = customerUserId != null
                ? userRepository.findById(customerUserId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found"))
                : null;

        BigDecimal depositAmount = pkg.getPrice().multiply(DEPOSIT_RATE).setScale(2, RoundingMode.HALF_UP);

        Booking booking = Booking.builder()
                .photographer(photographer)
                .servicePackage(pkg)
                .customer(customer)
                .clientName(request.getClientName())
                .clientPhone(request.getClientPhone())
                .clientEmail(request.getClientEmail())
                .bookingDate(request.getBookingDate())
                .timeSlot(request.getTimeSlot())
                .status(BookingStatus.PENDING)
                .otpVerified(false)
                .depositAmount(depositAmount)
                .depositPaid(false)
                .build();
        booking = bookingRepository.save(booking);

        markDate(photographer, request.getBookingDate(), AvailabilityStatus.BOOKED);

        return toResponse(booking);
    }

    // Configures (or reconfigures) how this booking's contact gets verified.
    // Safe to call more than once for the same booking — switching methods
    // before verification succeeds is exactly how a customer who changes their
    // mind on the booking flow's verification step gets a clean slate with the
    // newly chosen method, without creating a second booking or double-booking
    // the availability slot.
    @Transactional
    public BookingVerificationSetupResponse setupVerification(Long bookingId, BookingVerificationMethod method) {
        Booking booking = findById(bookingId);
        if (booking.isOtpVerified()) {
            throw new InvalidRequestException("This booking has already been verified");
        }

        booking.setVerificationMethod(method);
        booking.setQrVerificationToken(null);
        booking.setTotpSecret(null);

        return switch (method) {
            case PHONE_OTP -> {
                String code = otpService.sendOtp(booking.getClientPhone());
                yield BookingVerificationSetupResponse.builder()
                        .method(method)
                        .devOtpCode(code)
                        .instructions("Enter the 6-digit code we sent to " + booking.getClientPhone() + ".")
                        .build();
            }
            case EMAIL_OTP -> {
                try {
                    otpService.sendOtpEmail(booking.getClientEmail());
                } catch (MailException ex) {
                    log.warn("Could not email booking OTP to {}", booking.getClientEmail(), ex);
                    throw new InvalidRequestException(
                            "We couldn't send a verification email to " + booking.getClientEmail()
                                    + ". Please check the address or choose a different verification method.");
                }
                yield BookingVerificationSetupResponse.builder()
                        .method(method)
                        .instructions("Enter the 6-digit code we emailed to " + booking.getClientEmail() + ".")
                        .build();
            }
            case QR_CODE -> {
                booking.setQrVerificationToken(UUID.randomUUID().toString().replace("-", ""));
                yield BookingVerificationSetupResponse.builder()
                        .method(method)
                        .instructions("Ask " + booking.getPhotographer().getUser().getName()
                                + " to open this booking in their dashboard and show you its QR code, "
                                + "then scan it with your phone's camera to confirm.")
                        .build();
            }
            case TOTP -> {
                GoogleAuthenticatorKey key = GOOGLE_AUTHENTICATOR.createCredentials();
                booking.setTotpSecret(key.getKey());
                String otpAuthUrl = GoogleAuthenticatorQRGenerator.getOtpAuthURL(
                        "ShutterShot", booking.getClientEmail(), key);
                yield BookingVerificationSetupResponse.builder()
                        .method(method)
                        .totpSecret(key.getKey())
                        .totpQrDataUri(qrCodeService.generatePngDataUri(otpAuthUrl, 260))
                        .instructions("Scan this QR code with Google Authenticator (or any TOTP app), "
                                + "then enter the 6-digit code it shows.")
                        .build();
            }
        };
    }

    @Transactional
    public BookingResponse confirmOtp(Long bookingId, String code) {
        Booking booking = findById(bookingId);
        BookingVerificationMethod method = booking.getVerificationMethod();
        if (method == null) {
            throw new InvalidRequestException("Choose a verification method for this booking first");
        }

        boolean valid = switch (method) {
            case PHONE_OTP -> otpService.verifyOtp(booking.getClientPhone(), code);
            case EMAIL_OTP -> otpService.verifyOtp(booking.getClientEmail(), code);
            case TOTP -> verifyTotp(booking, code);
            case QR_CODE -> throw new InvalidRequestException(
                    "This booking is verified by scanning a QR code, not by entering a code");
        };

        if (!valid) {
            throw new InvalidRequestException("Invalid or expired code");
        }

        booking.setOtpVerified(true);
        return toResponse(booking);
    }

    private boolean verifyTotp(Booking booking, String code) {
        try {
            return GOOGLE_AUTHENTICATOR.authorize(booking.getTotpSecret(), Integer.parseInt(code.trim()));
        } catch (NumberFormatException ex) {
            return false;
        }
    }

    // Hit when the customer's browser lands on the link encoded in the QR the
    // photographer shows them in person (see getQrCodeForBooking below).
    @Transactional
    public BookingResponse verifyByQrToken(String token) {
        Booking booking = bookingRepository.findByQrVerificationToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("This verification link is invalid or has expired"));

        if (booking.getVerificationMethod() != BookingVerificationMethod.QR_CODE) {
            throw new InvalidRequestException("This booking is not set up for QR verification");
        }

        booking.setOtpVerified(true);
        return toResponse(booking);
    }

    // Photographer-facing: the QR image they show the customer in person to
    // scan. Ownership-checked the same way listByPhotographer/updateStatus are.
    @Transactional(readOnly = true)
    public QrCodeResponse getQrCodeForBooking(Long bookingId, Long authenticatedUserId) {
        Booking booking = findById(bookingId);
        PhotographerProfile owner = findOwnProfile(authenticatedUserId);
        if (!booking.getPhotographer().getId().equals(owner.getId())) {
            throw new AccessDeniedException("You can only view QR codes for your own bookings");
        }
        if (booking.getVerificationMethod() != BookingVerificationMethod.QR_CODE
                || booking.getQrVerificationToken() == null) {
            throw new InvalidRequestException("This booking isn't set up for QR verification");
        }

        String verifyUrl = frontendBaseUrl + "/verify-booking/" + booking.getQrVerificationToken();
        return QrCodeResponse.builder().qrCodeDataUri(qrCodeService.generatePngDataUri(verifyUrl, 280)).build();
    }

    @Transactional(readOnly = true)
    public BookingResponse getById(Long bookingId) {
        return toResponse(findById(bookingId));
    }

    // Opens an SSLCommerz checkout session for the booking's 10% deposit and
    // hands back the GatewayPageURL to redirect the browser to. The deposit is
    // only marked paid once SSLCommerz calls back to /payment/success and that
    // payment is re-validated server-side — see confirmDepositPayment below.
    @Transactional
    public BookingDepositInitResponse initiateDeposit(Long bookingId) {
        Booking booking = findById(bookingId);
        if (booking.isDepositPaid()) {
            throw new InvalidRequestException("The deposit for this booking has already been paid");
        }

        String tranId = "DEP" + booking.getId() + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);

        BookingPaymentTransaction transaction = BookingPaymentTransaction.builder()
                .tranId(tranId)
                .booking(booking)
                .amount(booking.getDepositAmount())
                .currency("BDT")
                .status(BookingPaymentStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
        bookingPaymentTransactionRepository.save(transaction);

        String gatewayUrl = sslCommerzService.initiateSession(
                booking.getDepositAmount(),
                tranId,
                backendBaseUrl + "/api/bookings/payment/success",
                backendBaseUrl + "/api/bookings/payment/fail",
                backendBaseUrl + "/api/bookings/payment/cancel",
                booking.getClientName(),
                booking.getClientEmail(),
                booking.getClientPhone(),
                booking.getPhotographer().getBaseLocation());

        return BookingDepositInitResponse.builder().gatewayUrl(gatewayUrl).build();
    }

    // Called from the success_url callback. Returns the frontend URL to redirect
    // the customer's browser to — resolved here (not in the controller) because
    // it needs the booking's photographer id, which only this lookup has.
    @Transactional
    public String handleDepositSuccess(String tranId, String valId) {
        BookingPaymentTransaction transaction = bookingPaymentTransactionRepository.findByTranId(tranId).orElse(null);
        if (transaction == null) {
            log.warn("SSLCommerz success callback for unknown booking tran_id {}", tranId);
            return frontendBaseUrl + "/?payment=failed";
        }

        if (transaction.getStatus() != BookingPaymentStatus.VALID) {
            boolean valid = sslCommerzService.validateTransaction(valId, transaction.getAmount());
            if (valid) {
                transaction.setStatus(BookingPaymentStatus.VALID);
                transaction.setValidatedAt(LocalDateTime.now());
                transaction.getBooking().setDepositPaid(true);
            } else {
                transaction.setStatus(BookingPaymentStatus.FAILED);
            }
        }

        boolean success = transaction.getStatus() == BookingPaymentStatus.VALID;
        return buildReturnUrl(transaction.getBooking(), success ? "success" : "failed");
    }

    @Transactional
    public String handleDepositFail(String tranId) {
        BookingPaymentTransaction transaction = bookingPaymentTransactionRepository.findByTranId(tranId).orElse(null);
        if (transaction == null) {
            return frontendBaseUrl + "/?payment=failed";
        }
        if (transaction.getStatus() == BookingPaymentStatus.PENDING) {
            transaction.setStatus(BookingPaymentStatus.FAILED);
        }
        return buildReturnUrl(transaction.getBooking(), "failed");
    }

    @Transactional
    public String handleDepositCancel(String tranId) {
        BookingPaymentTransaction transaction = bookingPaymentTransactionRepository.findByTranId(tranId).orElse(null);
        if (transaction == null) {
            return frontendBaseUrl + "/?payment=cancelled";
        }
        if (transaction.getStatus() == BookingPaymentStatus.PENDING) {
            transaction.setStatus(BookingPaymentStatus.CANCELLED);
        }
        return buildReturnUrl(transaction.getBooking(), "cancelled");
    }

    private String buildReturnUrl(Booking booking, String result) {
        return frontendBaseUrl + "/book/" + booking.getPhotographer().getId()
                + "?payment=" + result + "&bookingId=" + booking.getId();
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> listByPhotographer(Long photographerId, Long authenticatedUserId) {
        PhotographerProfile owner = findOwnProfile(authenticatedUserId);
        if (!owner.getId().equals(photographerId)) {
            throw new AccessDeniedException("You can only view your own bookings");
        }

        return toResponseList(bookingRepository.findByPhotographerId(photographerId));
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> listByCustomer(Long customerUserId) {
        return toResponseList(bookingRepository.findByCustomerIdOrderByBookingDateDesc(customerUserId));
    }

    // Looks up which of these bookings already have a review in a single query,
    // rather than one existsByBookingId call per booking in the stream below.
    private List<BookingResponse> toResponseList(List<Booking> bookings) {
        if (bookings.isEmpty()) {
            return List.of();
        }
        List<Long> bookingIds = bookings.stream().map(Booking::getId).toList();
        Set<Long> reviewedIds = new HashSet<>(reviewRepository.findBookingIdsWithReview(bookingIds));
        return bookings.stream()
                .map(booking -> toResponse(booking, reviewedIds.contains(booking.getId())))
                .toList();
    }

    @Transactional
    public BookingResponse updateStatus(Long bookingId, BookingStatus newStatus, Long authenticatedUserId) {
        Booking booking = findById(bookingId);
        PhotographerProfile owner = findOwnProfile(authenticatedUserId);

        if (!booking.getPhotographer().getId().equals(owner.getId())) {
            throw new AccessDeniedException("You can only manage your own bookings");
        }

        validateTransition(booking.getStatus(), newStatus);

        if (newStatus == BookingStatus.CONFIRMED) {
            if (!booking.isOtpVerified()) {
                throw new InvalidRequestException("Cannot confirm a booking whose contact has not been verified");
            }
            if (!booking.isDepositPaid()) {
                throw new InvalidRequestException("Cannot confirm a booking until the 10% deposit has been paid");
            }
        }

        booking.setStatus(newStatus);

        if (newStatus == BookingStatus.CANCELLED) {
            markDate(booking.getPhotographer(), booking.getBookingDate(), AvailabilityStatus.FREE);
        }

        return toResponse(booking);
    }

    private void validateTransition(BookingStatus current, BookingStatus next) {
        boolean valid = switch (current) {
            case PENDING -> next == BookingStatus.CONFIRMED || next == BookingStatus.CANCELLED;
            case CONFIRMED -> next == BookingStatus.COMPLETED || next == BookingStatus.CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };
        if (!valid) {
            throw new InvalidRequestException("Cannot change booking status from " + current + " to " + next);
        }
    }

    private void markDate(PhotographerProfile photographer, LocalDate date, AvailabilityStatus status) {
        Availability availability = availabilityRepository.findByPhotographerIdAndDate(photographer.getId(), date)
                .orElseGet(() -> Availability.builder().photographer(photographer).date(date).build());
        availability.setStatus(status);
        availabilityRepository.save(availability);
    }

    private Booking findById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    private PhotographerProfile findOwnProfile(Long authenticatedUserId) {
        return photographerProfileRepository.findByUserId(authenticatedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Photographer profile not found for current user"));
    }

    private BookingResponse toResponse(Booking booking) {
        return toResponse(booking, reviewRepository.existsByBookingId(booking.getId()));
    }

    private BookingResponse toResponse(Booking booking, boolean reviewed) {
        return BookingResponse.builder()
                .id(booking.getId())
                .photographerId(booking.getPhotographer().getId())
                .photographerName(booking.getPhotographer().getUser().getName())
                .packageId(booking.getServicePackage().getId())
                .packageTitle(booking.getServicePackage().getTitle())
                .packagePrice(booking.getServicePackage().getPrice())
                .customerId(booking.getCustomer() != null ? booking.getCustomer().getId() : null)
                .clientName(booking.getClientName())
                .clientPhone(booking.getClientPhone())
                .clientEmail(booking.getClientEmail())
                .bookingDate(booking.getBookingDate())
                .timeSlot(booking.getTimeSlot())
                .status(booking.getStatus())
                .otpVerified(booking.isOtpVerified())
                .verificationMethod(booking.getVerificationMethod())
                .depositAmount(booking.getDepositAmount())
                .depositPaid(booking.isDepositPaid())
                .reviewed(reviewed)
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
