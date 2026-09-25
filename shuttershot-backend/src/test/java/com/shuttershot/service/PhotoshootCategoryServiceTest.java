package com.shuttershot.service;

import com.shuttershot.dto.CreatePhotoshootCategoryRequest;
import com.shuttershot.dto.PhotoshootCategoryResponse;
import com.shuttershot.exception.DuplicateResourceException;
import com.shuttershot.exception.InvalidRequestException;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.PhotoshootCategory;
import com.shuttershot.repository.PhotoshootCategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PhotoshootCategoryServiceTest {

    @Mock
    private PhotoshootCategoryRepository repository;

    private PhotoshootCategoryService service;

    @BeforeEach
    void setUp() {
        service = new PhotoshootCategoryService(repository);
        when(repository.save(any(PhotoshootCategory.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private static PhotoshootCategory category(Long id, String name, String searchValue) {
        return PhotoshootCategory.builder()
                .id(id).name(name).details("Old details").searchValue(searchValue).build();
    }

    private static CreatePhotoshootCategoryRequest request(String name, String details, List<String> goodFor) {
        return new CreatePhotoshootCategoryRequest(name, "  A summary  ", details, goodFor, "  Look for this  ");
    }

    @Test
    void listPutsBuiltInsFirstInTheirFixedOrderThenAddedCategoriesByAge() {
        when(repository.findAllByOrderByIdAsc()).thenReturn(List.of(
                category(1L, "Maternity", null),
                category(2L, "Landscape", "landscape"),
                category(3L, "Wedding", "wedding"),
                category(4L, "Newborn", null),
                category(5L, "Event", "event"),
                category(6L, "Portrait", "portrait")));

        List<String> names = service.list().stream().map(PhotoshootCategoryResponse::getName).toList();

        assertEquals(List.of("Wedding", "Portrait", "Event", "Landscape", "Maternity", "Newborn"), names);
    }

    @Test
    void editingABuiltInCategoryChangesItsTextButKeepsItsSearchValue() {
        PhotoshootCategory wedding = category(3L, "Wedding", "wedding");
        when(repository.findById(3L)).thenReturn(Optional.of(wedding));
        when(repository.existsByNameIgnoreCaseAndIdNot("Weddings", 3L)).thenReturn(false);

        PhotoshootCategoryResponse response = service.update(
                3L, request("  Weddings ", "  New details  ", List.of("  First ", "", "Second  ", "   ")));

        assertEquals("Weddings", wedding.getName());
        assertEquals("New details", wedding.getDetails());
        assertEquals("A summary", wedding.getSummary());
        assertEquals("Look for this", wedding.getLookFor());
        assertEquals("First\nSecond", wedding.getGoodFor());
        assertEquals("wedding", wedding.getSearchValue());
        assertTrue(response.isBuiltIn());
        assertEquals(List.of("First", "Second"), response.getGoodFor());
    }

    @Test
    void editingCanClearTheOptionalFields() {
        PhotoshootCategory maternity = category(9L, "Maternity", null);
        maternity.setSummary("Old summary");
        maternity.setGoodFor("One\nTwo");
        maternity.setLookFor("Old advice");
        when(repository.findById(9L)).thenReturn(Optional.of(maternity));

        service.update(9L, new CreatePhotoshootCategoryRequest("Maternity", "", "Details", List.of(), ""));

        assertNull(maternity.getSummary());
        assertNull(maternity.getGoodFor());
        assertNull(maternity.getLookFor());
    }

    @Test
    void renamingToAnotherCategorysNameIsRejectedButKeepingYourOwnNameIsFine() {
        when(repository.findById(9L)).thenReturn(Optional.of(category(9L, "Maternity", null)));
        when(repository.existsByNameIgnoreCaseAndIdNot("wedding", 9L)).thenReturn(true);

        assertThrows(DuplicateResourceException.class,
                () -> service.update(9L, request("wedding", "Details", List.of())));
        verify(repository, never()).save(any());

        when(repository.existsByNameIgnoreCaseAndIdNot("Maternity", 9L)).thenReturn(false);
        service.update(9L, request("Maternity", "Details", List.of()));
    }

    @Test
    void updatingAMissingCategoryIsNotFound() {
        when(repository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.update(404L, request("Anything", "Details", List.of())));
    }

    @Test
    void builtInCategoriesCannotBeRemoved() {
        PhotoshootCategory portrait = category(4L, "Portrait", "portrait");
        when(repository.findById(4L)).thenReturn(Optional.of(portrait));

        assertThrows(InvalidRequestException.class, () -> service.delete(4L));
        verify(repository, never()).delete(any(PhotoshootCategory.class));
    }

    @Test
    void addedCategoriesCanBeRemoved() {
        PhotoshootCategory maternity = category(9L, "Maternity", null);
        when(repository.findById(9L)).thenReturn(Optional.of(maternity));

        service.delete(9L);

        verify(repository).delete(maternity);
    }

    @Test
    void creatingAnAddedCategoryStoresItWithoutASearchValue() {
        when(repository.existsByNameIgnoreCase("Newborn")).thenReturn(false);

        PhotoshootCategoryResponse response = service.create(request("Newborn", "Details", List.of("Sessions")));

        ArgumentCaptor<PhotoshootCategory> saved = ArgumentCaptor.forClass(PhotoshootCategory.class);
        verify(repository).save(saved.capture());
        assertNull(saved.getValue().getSearchValue());
        assertFalse(response.isBuiltIn());
        assertEquals("Newborn", response.getName());
    }

    @Test
    void creatingWithAnExistingNameIsRejected() {
        when(repository.existsByNameIgnoreCase("Wedding")).thenReturn(true);

        assertThrows(DuplicateResourceException.class,
                () -> service.create(request("Wedding", "Details", List.of())));
    }

    @Test
    void goodForIsLimitedToEightShortItems() {
        when(repository.existsByNameIgnoreCase("Many")).thenReturn(false);

        assertThrows(InvalidRequestException.class, () -> service.create(request(
                "Many", "Details", List.of("1", "2", "3", "4", "5", "6", "7", "8", "9"))));
        assertThrows(InvalidRequestException.class, () -> service.create(request(
                "Many", "Details", List.of("x".repeat(101)))));
    }

    @Test
    void ensureBuiltInsCreatesOnlyTheMissingOnes() {
        when(repository.existsBySearchValue("wedding")).thenReturn(true);
        when(repository.existsBySearchValue("portrait")).thenReturn(true);
        when(repository.existsBySearchValue("event")).thenReturn(false);
        when(repository.existsBySearchValue("landscape")).thenReturn(false);

        service.ensureBuiltIns();

        ArgumentCaptor<PhotoshootCategory> saved = ArgumentCaptor.forClass(PhotoshootCategory.class);
        verify(repository, times(2)).save(saved.capture());
        assertEquals(List.of("event", "landscape"),
                saved.getAllValues().stream().map(PhotoshootCategory::getSearchValue).toList());
        assertEquals("Event", saved.getAllValues().get(0).getName());
    }
}
