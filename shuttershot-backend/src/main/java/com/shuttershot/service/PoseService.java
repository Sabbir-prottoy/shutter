package com.shuttershot.service;

import com.shuttershot.dto.PoseExampleResponse;
import com.shuttershot.exception.ResourceNotFoundException;
import com.shuttershot.model.PoseExample;
import com.shuttershot.model.PoseSubsection;
import com.shuttershot.repository.PoseExampleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PoseService {

    private final PoseExampleRepository poseExampleRepository;
    private final FileStorageService fileStorageService;

    // Grouped by subsection slug (lowercase enum name) so the frontend can
    // index straight into it by the same slugs it already uses for its tabs.
    @Transactional(readOnly = true)
    public Map<String, List<PoseExampleResponse>> listGroupedBySubsection() {
        return poseExampleRepository.findAllByOrderBySubsectionAscCreatedAtAsc().stream()
                .map(this::toResponse)
                .collect(Collectors.groupingBy(
                        PoseExampleResponse::getSubsectionSlug, LinkedHashMap::new, Collectors.toList()));
    }

    @Transactional
    public PoseExampleResponse upload(MultipartFile file, PoseSubsection subsection) {
        String imageUrl = fileStorageService.store(file);
        PoseExample example = PoseExample.builder()
                .subsection(subsection)
                .imageUrl(imageUrl)
                .build();
        return toResponse(poseExampleRepository.save(example));
    }

    @Transactional
    public void delete(Long id) {
        PoseExample example = poseExampleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pose example not found with id: " + id));
        fileStorageService.delete(example.getImageUrl());
        poseExampleRepository.delete(example);
    }

    private PoseExampleResponse toResponse(PoseExample example) {
        return PoseExampleResponse.builder()
                .id(example.getId())
                .subsectionSlug(example.getSubsection().name().toLowerCase())
                .imageUrl(example.getImageUrl())
                .createdAt(example.getCreatedAt())
                .build();
    }
}
