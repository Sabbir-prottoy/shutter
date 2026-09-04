package com.shuttershot.dto;

import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePhotographerProfileRequest {

    private String name;
    private String phone;
    private String bio;
    private String profilePhotoUrl;

    private Set<String> specialties;
    private String baseLocation;

    @Min(value = 0, message = "Years of experience cannot be negative")
    private Integer yearsExperience;
}
