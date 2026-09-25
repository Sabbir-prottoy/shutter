package com.shuttershot.service;

import com.shuttershot.dto.CreatePhotoshootCategoryRequest;
import com.shuttershot.dto.PhotoshootCategoryResponse;
import com.shuttershot.exception.DuplicateResourceException;
import com.shuttershot.exception.InvalidRequestException;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.PhotoshootCategory;
import com.shuttershot.repository.PhotoshootCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PhotoshootCategoryService {

    // The categories photographer search is built on, in display order. Created
    // on startup if missing; after that an admin can edit their text freely.
    private static final List<String> BUILT_IN_ORDER = List.of("wedding", "portrait", "event", "landscape");

    private static final int MAX_GOOD_FOR_ITEMS = 8;
    private static final int MAX_GOOD_FOR_LENGTH = 100;

    private final PhotoshootCategoryRepository photoshootCategoryRepository;

    // Built-in categories first, in their fixed order, then admin-added ones
    // in the order they were added.
    @Transactional(readOnly = true)
    public List<PhotoshootCategoryResponse> list() {
        return photoshootCategoryRepository.findAllByOrderByIdAsc().stream()
                .sorted(Comparator.comparingInt(this::displayRank))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PhotoshootCategoryResponse create(CreatePhotoshootCategoryRequest request) {
        String name = request.getName().trim();
        if (photoshootCategoryRepository.existsByNameIgnoreCase(name)) {
            throw new DuplicateResourceException("A category named \"" + name + "\" already exists");
        }

        PhotoshootCategory category = new PhotoshootCategory();
        apply(category, request, name);
        return toResponse(photoshootCategoryRepository.save(category));
    }

    @Transactional
    public PhotoshootCategoryResponse update(Long id, CreatePhotoshootCategoryRequest request) {
        PhotoshootCategory category = findById(id);
        String name = request.getName().trim();
        if (photoshootCategoryRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new DuplicateResourceException("A category named \"" + name + "\" already exists");
        }

        apply(category, request, name);
        return toResponse(category);
    }

    @Transactional
    public void delete(Long id) {
        PhotoshootCategory category = findById(id);
        if (category.getSearchValue() != null) {
            throw new InvalidRequestException(
                    "\"" + category.getName() + "\" is built in - photographer search depends on it - "
                            + "so it can be edited but not removed");
        }
        photoshootCategoryRepository.delete(category);
    }

    // Creates any missing built-in category with its starting text.
    @Transactional
    public void ensureBuiltIns() {
        for (String searchValue : BUILT_IN_ORDER) {
            if (!photoshootCategoryRepository.existsBySearchValue(searchValue)) {
                photoshootCategoryRepository.save(defaultFor(searchValue));
            }
        }
    }

    private void apply(PhotoshootCategory category, CreatePhotoshootCategoryRequest request, String name) {
        List<String> goodFor = cleanGoodFor(request.getGoodFor());
        category.setName(name);
        category.setSummary(blankToNull(request.getSummary()));
        category.setDetails(request.getDetails().trim());
        category.setGoodFor(goodFor.isEmpty() ? null : String.join("\n", goodFor));
        category.setLookFor(blankToNull(request.getLookFor()));
    }

    private PhotoshootCategory findById(Long id) {
        return photoshootCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
    }

    private int displayRank(PhotoshootCategory category) {
        int index = category.getSearchValue() == null ? -1 : BUILT_IN_ORDER.indexOf(category.getSearchValue());
        return index >= 0 ? index : BUILT_IN_ORDER.size();
    }

    private List<String> cleanGoodFor(List<String> items) {
        if (items == null) {
            return List.of();
        }
        List<String> cleaned = items.stream()
                .filter(item -> item != null && !item.isBlank())
                .map(String::trim)
                .toList();
        if (cleaned.size() > MAX_GOOD_FOR_ITEMS) {
            throw new InvalidRequestException("\"Good for\" can list at most " + MAX_GOOD_FOR_ITEMS + " items");
        }
        if (cleaned.stream().anyMatch(item -> item.length() > MAX_GOOD_FOR_LENGTH)) {
            throw new InvalidRequestException(
                    "Each \"good for\" item must be at most " + MAX_GOOD_FOR_LENGTH + " characters");
        }
        return cleaned;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private PhotoshootCategoryResponse toResponse(PhotoshootCategory category) {
        List<String> goodFor = category.getGoodFor() == null
                ? List.of()
                : Arrays.stream(category.getGoodFor().split("\n")).filter(line -> !line.isBlank()).toList();
        return PhotoshootCategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .summary(category.getSummary())
                .details(category.getDetails())
                .goodFor(goodFor)
                .lookFor(category.getLookFor())
                .searchValue(category.getSearchValue())
                .builtIn(category.getSearchValue() != null)
                .build();
    }

    private PhotoshootCategory defaultFor(String searchValue) {
        return switch (searchValue) {
            case "wedding" -> builtIn(searchValue, "Wedding",
                    "Full-day coverage of the ceremony, reception, and the couple.",
                    "Covers everything from getting-ready shots and the ceremony itself to reception candids and "
                            + "posed couple portraits. Many photographers also offer holud and pre-wedding shoots "
                            + "as add-ons.",
                    "Wedding day and reception\nHolud and pre-wedding shoots\nFamily group portraits on the day",
                    "Someone experienced with your specific ceremony traditions, available for the full event "
                            + "length you need, with a clear turnaround time for edited photos.");
            case "portrait" -> builtIn(searchValue, "Portrait",
                    "Individual or small-group sessions, studio or outdoors.",
                    "A focused session built around one or two subjects rather than a large event — professional "
                            + "headshots, family portraits, graduation photos, or maternity and newborn sessions.",
                    "Professional headshots\nFamily or couple portraits\nGraduation, maternity, or newborn shoots",
                    "A portfolio in a style you actually like (studio-lit vs. natural light), and clarity on how "
                            + "many edited photos you get.");
            case "event" -> builtIn(searchValue, "Event",
                    "Birthdays, corporate events, and other gatherings.",
                    "Documents a gathering as it happens — candid crowd moments, speeches, performances, and "
                            + "group shots — rather than posed individual portraits.",
                    "Birthdays and anniversaries\nCorporate events and conferences\nCultural and religious celebrations",
                    "Someone comfortable working unobtrusively in a crowd, with fast turnaround if you need "
                            + "photos shared soon after.");
            case "landscape" -> builtIn(searchValue, "Landscape",
                    "Travel, nature, architecture, and outdoor scenes.",
                    "Photography of places rather than people — travel and nature shoots, architecture and "
                            + "interiors, or cityscapes, often for personal prints, brand content, or real estate.",
                    "Travel and nature photography\nArchitecture and interiors\nReal estate and location shoots",
                    "A portfolio shot in conditions similar to yours (time of day, season, indoor vs. outdoor), "
                            + "since lighting matters most here.");
            default -> throw new IllegalArgumentException("Unknown built-in category: " + searchValue);
        };
    }

    private PhotoshootCategory builtIn(
            String searchValue, String name, String summary, String details, String goodFor, String lookFor) {
        return PhotoshootCategory.builder()
                .searchValue(searchValue)
                .name(name)
                .summary(summary)
                .details(details)
                .goodFor(goodFor)
                .lookFor(lookFor)
                .build();
    }
}
