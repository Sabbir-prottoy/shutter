package com.shuttershot.repository;

import com.shuttershot.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByPhotographerId(Long photographerId);

    List<Booking> findByCustomerIdOrderByBookingDateDesc(Long customerId);

    // Used when permanently removing a user account — bookings they made
    // while logged in fall back to being anonymous/guest records rather
    // than being deleted, since the photographer's booking history is
    // still theirs to keep.
    @Modifying
    @Query("UPDATE Booking b SET b.customer = null WHERE b.customer.id = :userId")
    void clearCustomerReference(@Param("userId") Long userId);
}
