package com.shuttershot.controller;

import com.shuttershot.dto.CreateMusicSuggestionRequest;
import com.shuttershot.dto.MusicSuggestionResponse;
import com.shuttershot.service.MusicService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

// Public read at /api/music (permitAll - see SecurityConfig); add and remove
// under /api/admin/music, already covered by the /api/admin/** ADMIN/MODERATOR rule.
@RestController
@RequiredArgsConstructor
public class MusicController {

    private final MusicService musicService;

    @GetMapping("/api/music")
    public ResponseEntity<Map<String, List<MusicSuggestionResponse>>> listPublic() {
        return ResponseEntity.ok(musicService.listGrouped());
    }

    @GetMapping("/api/admin/music")
    public ResponseEntity<Map<String, List<MusicSuggestionResponse>>> listForAdmin() {
        return ResponseEntity.ok(musicService.listGrouped());
    }

    @PostMapping("/api/admin/music")
    public ResponseEntity<MusicSuggestionResponse> create(@Valid @RequestBody CreateMusicSuggestionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(musicService.create(request));
    }

    @DeleteMapping("/api/admin/music/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        musicService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
