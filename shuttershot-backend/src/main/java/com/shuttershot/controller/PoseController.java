package com.shuttershot.controller;

import com.shuttershot.dto.PoseExampleResponse;
import com.shuttershot.model.PoseSubsection;
import com.shuttershot.service.PoseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

// Public read at /api/poses (permitAll — see SecurityConfig), write/delete
// under /api/admin/poses, already covered by the existing /api/admin/**
// ADMIN/MODERATOR rule with no further security config needed.
@RestController
@RequiredArgsConstructor
public class PoseController {

    private final PoseService poseService;

    @GetMapping("/api/poses")
    public ResponseEntity<Map<String, List<PoseExampleResponse>>> listPublic() {
        return ResponseEntity.ok(poseService.listGroupedBySubsection());
    }

    @GetMapping("/api/admin/poses")
    public ResponseEntity<Map<String, List<PoseExampleResponse>>> listForAdmin() {
        return ResponseEntity.ok(poseService.listGroupedBySubsection());
    }

    @PostMapping(value = "/api/admin/poses", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PoseExampleResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("subsection") PoseSubsection subsection) {
        PoseExampleResponse response = poseService.upload(file, subsection);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/api/admin/poses/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        poseService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
