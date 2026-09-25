package com.shuttershot.config;

import com.shuttershot.service.PhotoshootCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

// Makes sure the four built-in photoshoot categories exist. Safe to run on
// every startup: it only creates the ones that are missing.
@Component
@RequiredArgsConstructor
public class PhotoshootCategorySeeder implements ApplicationRunner {

    private final PhotoshootCategoryService photoshootCategoryService;

    @Override
    public void run(ApplicationArguments args) {
        photoshootCategoryService.ensureBuiltIns();
    }
}
