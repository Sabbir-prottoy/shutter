package com.shuttershot.service;

import com.shuttershot.model.BookingMoneySettings;
import com.shuttershot.repository.BookingMoneySettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BookingMoneyServiceTest {

    private static final Long MAIN_ADMIN_ID = 2L;
    private static final Long OTHER_ADMIN_ID = 17L;

    @Mock
    private BookingMoneySettingsRepository repository;

    @Mock
    private MainAdminGuard mainAdminGuard;

    private BookingMoneyService service;

    @BeforeEach
    void setUp() {
        service = new BookingMoneyService(repository, mainAdminGuard);
        when(repository.save(any(BookingMoneySettings.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doThrow(new AccessDeniedException("Only the main admin can do that"))
                .when(mainAdminGuard).require(eq(OTHER_ADMIN_ID), anyString());
    }

    @Test
    void usesTheOriginalTenPercentUntilAnAdminSetsAnother() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        assertEquals(0, new BigDecimal("10.00").compareTo(service.getCurrentPercent()));
    }

    @Test
    void readingTheDefaultNeverWritesARow() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        service.getCurrentPercent();

        verify(repository, never()).save(any());
    }

    @Test
    void returnsTheStoredPercentage() {
        when(repository.findById(1L)).thenReturn(Optional.of(
                BookingMoneySettings.builder()
                        .id(1L).depositPercent(new BigDecimal("25.50")).updatedAt(LocalDateTime.now()).build()));

        assertEquals(0, new BigDecimal("25.50").compareTo(service.getCurrentPercent()));
    }

    @Test
    void firstSaveCreatesTheSingletonRow() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        BigDecimal saved = service.updatePercent(new BigDecimal("15"), MAIN_ADMIN_ID);

        ArgumentCaptor<BookingMoneySettings> captor = ArgumentCaptor.forClass(BookingMoneySettings.class);
        verify(repository).save(captor.capture());
        assertEquals(1L, captor.getValue().getId());
        assertEquals(0, new BigDecimal("15.00").compareTo(captor.getValue().getDepositPercent()));
        assertNotNull(captor.getValue().getUpdatedAt());
        assertEquals(0, new BigDecimal("15.00").compareTo(saved));
    }

    @Test
    void laterSavesUpdateTheExistingRow() {
        BookingMoneySettings existing = BookingMoneySettings.builder()
                .id(1L).depositPercent(new BigDecimal("10.00")).updatedAt(LocalDateTime.now().minusDays(1)).build();
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        service.updatePercent(new BigDecimal("30.25"), MAIN_ADMIN_ID);

        verify(repository).save(existing);
        assertEquals(0, new BigDecimal("30.25").compareTo(existing.getDepositPercent()));
    }

    @Test
    void onlyTheMainAdminCanChangeIt() {
        assertThrows(AccessDeniedException.class,
                () -> service.updatePercent(new BigDecimal("50"), OTHER_ADMIN_ID));

        verify(repository, never()).save(any());
    }

    @Test
    void onlyTheMainAdminCanViewItInTheAdminPanel() {
        assertThrows(AccessDeniedException.class, () -> service.getPercentForAdmin(OTHER_ADMIN_ID));
    }
}
